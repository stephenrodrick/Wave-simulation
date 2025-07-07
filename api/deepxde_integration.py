import numpy as np
import tensorflow as tf
import deepxde as dde
from typing import Dict, List, Tuple, Optional, Any
import json
import pickle
import os
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor

@dataclass
class PINNConfig:
    """Configuration for Physics-Informed Neural Network"""
    layers: List[int]
    activation: str = "tanh"
    initializer: str = "Glorot uniform"
    learning_rate: float = 0.001
    epochs: int = 10000
    loss_weights: Dict[str, float] = None
    
    def __post_init__(self):
        if self.loss_weights is None:
            self.loss_weights = {"data": 1.0, "pde": 1.0, "bc": 10.0}

@dataclass
class BlastWaveParams:
    """Parameters for blast wave simulation"""
    explosive_mass: float  # kg TNT equivalent
    center_x: float
    center_y: float
    domain_size: Tuple[float, float, float, float]  # [x_min, x_max, y_min, y_max]
    time_range: Tuple[float, float]  # [t_min, t_max]

class BlastWavePINN:
    """Physics-Informed Neural Network for blast wave simulation"""
    
    def __init__(self, config: PINNConfig, blast_params: BlastWaveParams):
        self.config = config
        self.blast_params = blast_params
        self.model = None
        self.trained = False
        
        # Set up DeepXDE backend
        dde.config.set_default_float("float32")
        
    def pde(self, x, y):
        """
        Define the 2D Euler equations for blast wave propagation
        x: input coordinates [x, y, t]
        y: output [rho, u, v, p] (density, velocity_x, velocity_y, pressure)
        """
        rho, u, v, p = y[:, 0:1], y[:, 1:2], y[:, 2:3], y[:, 3:4]
        
        # Compute derivatives
        rho_t = dde.grad.jacobian(y, x, i=0, j=2)
        rho_x = dde.grad.jacobian(y, x, i=0, j=0)
        rho_y = dde.grad.jacobian(y, x, i=0, j=1)
        
        u_t = dde.grad.jacobian(y, x, i=1, j=2)
        u_x = dde.grad.jacobian(y, x, i=1, j=0)
        u_y = dde.grad.jacobian(y, x, i=1, j=1)
        
        v_t = dde.grad.jacobian(y, x, i=2, j=2)
        v_x = dde.grad.jacobian(y, x, i=2, j=0)
        v_y = dde.grad.jacobian(y, x, i=2, j=1)
        
        p_x = dde.grad.jacobian(y, x, i=3, j=0)
        p_y = dde.grad.jacobian(y, x, i=3, j=1)
        
        # 2D Euler equations
        # Continuity equation
        continuity = rho_t + rho_x * u + rho * u_x + rho_y * v + rho * v_y
        
        # Momentum equations
        momentum_x = rho * u_t + rho * u * u_x + rho * v * u_y + p_x
        momentum_y = rho * v_t + rho * u * v_x + rho * v * v_y + p_y
        
        # Energy equation (simplified, assuming ideal gas)
        gamma = 1.4  # Heat capacity ratio for air
        energy = p - (gamma - 1) * rho * (u**2 + v**2) / 2
        
        return [continuity, momentum_x, momentum_y, energy]
    
    def initial_condition(self, x):
        """Initial conditions for blast wave"""
        x_coord, y_coord = x[:, 0:1], x[:, 1:2]
        
        # Distance from explosion center
        r = tf.sqrt((x_coord - self.blast_params.center_x)**2 + 
                   (y_coord - self.blast_params.center_y)**2)
        
        # Initial blast parameters based on TNT equivalent
        # Sedov-Taylor blast wave solution for initial conditions
        E0 = self.blast_params.explosive_mass * 4.6e6  # TNT energy in J/kg
        rho0 = 1.225  # Air density at sea level
        
        # Initial pressure distribution (simplified)
        p_init = tf.where(r < 1.0, 
                         101325 + E0 / (4 * np.pi * r**2 + 1e-6),  # High pressure near center
                         101325)  # Atmospheric pressure far away
        
        # Initial density (slightly perturbed)
        rho_init = tf.where(r < 1.0, rho0 * 2.0, rho0)
        
        # Initial velocity (radial expansion)
        u_init = tf.where(r < 1.0, (x_coord - self.blast_params.center_x) / (r + 1e-6) * 100, 0.0)
        v_init = tf.where(r < 1.0, (y_coord - self.blast_params.center_y) / (r + 1e-6) * 100, 0.0)
        
        return tf.concat([rho_init, u_init, v_init, p_init], axis=1)
    
    def boundary_condition(self, x, on_boundary):
        """Boundary conditions (far-field conditions)"""
        return tf.constant([[1.225, 0.0, 0.0, 101325.0]])  # Atmospheric conditions
    
    def create_geometry_and_data(self):
        """Create computational domain and training data"""
        # Define 2D+time domain
        x_min, x_max, y_min, y_max = self.blast_params.domain_size
        t_min, t_max = self.blast_params.time_range
        
        # Spatial domain
        spatial_domain = dde.geometry.Rectangle([x_min, y_min], [x_max, y_max])
        
        # Time domain
        time_domain = dde.geometry.TimeDomain(t_min, t_max)
        
        # Combine spatial and temporal domains
        geom_time = dde.geometry.GeometryXTime(spatial_domain, time_domain)
        
        # Define PDE
        pde_data = dde.data.PDE(
            geom_time,
            self.pde,
            [],  # No boundary conditions for now (can add later)
            num_domain=2000,
            num_boundary=200,
            num_initial=500,
        )
        
        return pde_data
    
    def create_network(self):
        """Create neural network architecture"""
        # Input: [x, y, t], Output: [rho, u, v, p]
        net = dde.nn.FNN(
            self.config.layers,
            self.config.activation,
            self.config.initializer
        )
        
        return net
    
    def train(self, training_data: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Train the PINN model"""
        try:
            # Create geometry and PDE data
            data = self.create_geometry_and_data()
            
            # Create network
            net = self.create_network()
            
            # Create model
            self.model = dde.Model(data, net)
            
            # Compile model
            self.model.compile(
                "adam",
                lr=self.config.learning_rate,
                loss_weights=list(self.config.loss_weights.values())
            )
            
            # Train model
            losshistory, train_state = self.model.train(
                iterations=self.config.epochs,
                display_every=1000
            )
            
            self.trained = True
            
            # Return training metrics
            return {
                "final_loss": float(losshistory.loss_train[-1]),
                "epochs_trained": len(losshistory.loss_train),
                "convergence": losshistory.loss_train[-1] < 1e-3,
                "loss_history": losshistory.loss_train.tolist()
            }
            
        except Exception as e:
            raise Exception(f"PINN training failed: {str(e)}")
    
    def predict(self, coordinates: np.ndarray) -> np.ndarray:
        """
        Predict blast wave fields at given coordinates
        coordinates: array of shape (N, 3) with [x, y, t] values
        Returns: array of shape (N, 4) with [rho, u, v, p] values
        """
        if not self.trained or self.model is None:
            raise ValueError("Model must be trained before prediction")
        
        try:
            predictions = self.model.predict(coordinates)
            return predictions
        except Exception as e:
            raise Exception(f"PINN prediction failed: {str(e)}")
    
    def save_model(self, filepath: str):
        """Save trained model"""
        if not self.trained:
            raise ValueError("Cannot save untrained model")
        
        self.model.save(filepath)
        
        # Save configuration
        config_path = filepath + "_config.json"
        with open(config_path, 'w') as f:
            json.dump({
                "config": self.config.__dict__,
                "blast_params": self.blast_params.__dict__
            }, f)
    
    def load_model(self, filepath: str):
        """Load trained model"""
        # Load configuration
        config_path = filepath + "_config.json"
        with open(config_path, 'r') as f:
            saved_data = json.load(f)
        
        # Recreate model structure
        data = self.create_geometry_and_data()
        net = self.create_network()
        self.model = dde.Model(data, net)
        
        # Load weights
        self.model.restore(filepath)
        self.trained = True

class PINNSimulationEngine:
    """High-level interface for PINN-based blast wave simulations"""
    
    def __init__(self):
        self.models = {}
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    async def create_and_train_model(
        self, 
        model_id: str,
        config: PINNConfig,
        blast_params: BlastWaveParams,
        training_data: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Create and train a new PINN model asynchronously"""
        
        def train_model():
            pinn = BlastWavePINN(config, blast_params)
            metrics = pinn.train(training_data)
            return pinn, metrics
        
        # Run training in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        pinn, metrics = await loop.run_in_executor(self.executor, train_model)
        
        self.models[model_id] = pinn
        return metrics
    
    async def predict_frame(
        self, 
        model_id: str, 
        coordinates: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """Predict blast wave fields for a single frame"""
        
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        pinn = self.models[model_id]
        
        def predict():
            return pinn.predict(coordinates)
        
        loop = asyncio.get_event_loop()
        predictions = await loop.run_in_executor(self.executor, predict)
        
        # Split predictions into components
        rho = predictions[:, 0]
        u = predictions[:, 1]
        v = predictions[:, 2]
        p = predictions[:, 3]
        
        return {
            "density": rho,
            "velocity_x": u,
            "velocity_y": v,
            "pressure": p,
            "coordinates": coordinates
        }
    
    def get_pretrained_model_config(self) -> PINNConfig:
        """Get configuration for pre-trained blast wave model"""
        return PINNConfig(
            layers=[3, 50, 50, 50, 50, 4],  # Input: [x,y,t], Output: [rho,u,v,p]
            activation="tanh",
            learning_rate=0.001,
            epochs=10000,
            loss_weights={"data": 1.0, "pde": 1.0, "bc": 10.0}
        )
    
    def create_blast_params_from_config(self, sim_config: Dict[str, Any]) -> BlastWaveParams:
        """Create blast parameters from simulation configuration"""
        return BlastWaveParams(
            explosive_mass=float(sim_config.get("explosiveMass", 500)),
            center_x=float(sim_config.get("coordinates", {}).get("lng", 0)),
            center_y=float(sim_config.get("coordinates", {}).get("lat", 0)),
            domain_size=(-100, 100, -100, 100),  # 200m x 200m domain
            time_range=(0, 10)  # 10 seconds simulation
        )

# Global PINN engine instance
pinn_engine = PINNSimulationEngine()
