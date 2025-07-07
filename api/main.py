from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import numpy as np
from typing import List, Dict, Any
import uuid
from datetime import datetime
import logging
from real_time_data import get_real_time_urban_data
from deepxde_integration import pinn_engine, PINNConfig, BlastWaveParams

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ShockWave Sim AI API",
    description="Physics-Informed Neural Network API for blast wave simulations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo (use database in production)
simulations_db: Dict[str, Dict[str, Any]] = {}
active_connections: Dict[str, List[WebSocket]] = {}

class SimulationManager:
    def __init__(self):
        self.simulations = {}
    
    async def create_simulation(self, config: Dict[str, Any]) -> str:
        """Create a new simulation with given configuration"""
        sim_id = str(uuid.uuid4())
        
        simulation = {
            "id": sim_id,
            "name": config.get("name", f"Simulation {sim_id[:8]}"),
            "status": "queued",
            "progress": 0,
            "config": config,
            "created_at": datetime.utcnow().isoformat(),
            "frames": [],
            "metadata": {
                "total_frames": 250,
                "max_pressure": 0,
                "max_velocity": 0,
                "affected_area": 0
            }
        }
        
        simulations_db[sim_id] = simulation
        
        # Start simulation processing (in background)
        asyncio.create_task(self.process_simulation(sim_id))
        
        return sim_id
    
    async def process_simulation(self, sim_id: str):
        """Process simulation in background"""
        try:
            simulation = simulations_db[sim_id]
            simulation["status"] = "running"
            
            total_frames = simulation["metadata"]["total_frames"]
            
            for frame in range(total_frames):
                # Simulate processing time
                await asyncio.sleep(0.1)
                
                # Update progress
                progress = int((frame + 1) / total_frames * 100)
                simulation["progress"] = progress
                
                # Generate mock frame data
                frame_data = self.generate_frame_data(frame, total_frames)
                simulation["frames"].append(frame_data)
                
                # Update metadata
                simulation["metadata"]["max_pressure"] = max(
                    simulation["metadata"]["max_pressure"], 
                    frame_data["max_pressure"]
                )
                
                # Broadcast progress to connected clients
                await self.broadcast_progress(sim_id, {
                    "frame": frame,
                    "progress": progress,
                    "status": "running",
                    "frame_data": frame_data
                })
            
            simulation["status"] = "completed"
            simulation["progress"] = 100
            
            await self.broadcast_progress(sim_id, {
                "status": "completed",
                "progress": 100
            })
            
        except Exception as e:
            logger.error(f"Error processing simulation {sim_id}: {e}")
            simulation["status"] = "failed"
            await self.broadcast_progress(sim_id, {
                "status": "failed",
                "error": str(e)
            })
    
    def generate_frame_data(self, frame: int, total_frames: int) -> Dict[str, Any]:
        """Generate mock frame data for visualization"""
        t = frame / total_frames * 10  # 10 seconds total
        
        # Simulate blast wave propagation
        max_pressure = 15.0 * np.exp(-t * 0.5) * max(0, np.sin(t * 2))
        max_velocity = 350.0 * np.exp(-t * 0.3) * max(0, np.cos(t * 1.5))
        
        return {
            "frame": frame,
            "time": t,
            "max_pressure": float(max_pressure),
            "max_velocity": float(max_velocity),
            "pressure_field": self.generate_pressure_field(t),
            "velocity_field": self.generate_velocity_field(t)
        }
    
    def generate_pressure_field(self, t: float) -> List[List[float]]:
        """Generate 2D pressure field data"""
        size = 50
        field = []
        center = size // 2
        
        for i in range(size):
            row = []
            for j in range(size):
                # Distance from center
                r = np.sqrt((i - center)**2 + (j - center)**2)
                
                # Blast wave equation (simplified)
                wave_radius = t * 30  # Wave speed
                if abs(r - wave_radius) < 5:
                    pressure = 15.0 * np.exp(-t * 0.5) * (1 - abs(r - wave_radius) / 5)
                else:
                    pressure = 0.0
                
                row.append(max(0, pressure))
            field.append(row)
        
        return field
    
    def generate_velocity_field(self, t: float) -> List[List[Dict[str, float]]]:
        """Generate 2D velocity field data"""
        size = 25  # Smaller for velocity vectors
        field = []
        center = size // 2
        
        for i in range(size):
            row = []
            for j in range(size):
                # Distance and angle from center
                dx = i - center
                dy = j - center
                r = np.sqrt(dx**2 + dy**2)
                
                if r > 0:
                    # Radial velocity
                    wave_radius = t * 30
                    if abs(r - wave_radius) < 3:
                        magnitude = 300.0 * np.exp(-t * 0.3)
                        vx = magnitude * dx / r
                        vy = magnitude * dy / r
                    else:
                        vx = vy = 0.0
                else:
                    vx = vy = 0.0
                
                row.append({"x": vx, "y": vy})
            field.append(row)
        
        return field
    
    async def broadcast_progress(self, sim_id: str, data: Dict[str, Any]):
        """Broadcast progress to all connected WebSocket clients"""
        if sim_id in active_connections:
            disconnected = []
            for websocket in active_connections[sim_id]:
                try:
                    await websocket.send_text(json.dumps(data))
                except:
                    disconnected.append(websocket)
            
            # Remove disconnected clients
            for ws in disconnected:
                active_connections[sim_id].remove(ws)

# Initialize simulation manager
sim_manager = SimulationManager()

@app.get("/")
async def root():
    return {"message": "ShockWave Sim AI API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/simulations")
async def create_simulation(config: Dict[str, Any]):
    """Create a new blast wave simulation"""
    try:
        sim_id = await sim_manager.create_simulation(config)
        return {"simulation_id": sim_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/simulations")
async def list_simulations():
    """List all simulations"""
    return {"simulations": list(simulations_db.values())}

@app.get("/api/simulations/{sim_id}")
async def get_simulation(sim_id: str):
    """Get simulation details"""
    if sim_id not in simulations_db:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return simulations_db[sim_id]

@app.websocket("/api/simulations/{sim_id}/stream")
async def websocket_simulation_stream(websocket: WebSocket, sim_id: str):
    """WebSocket endpoint for real-time simulation updates"""
    await websocket.accept()
    logger.info(f"WebSocket connected for simulation {sim_id}")
    
    # Add to active connections
    if sim_id not in active_connections:
        active_connections[sim_id] = []
    active_connections[sim_id].append(websocket)
    
    try:
        # Send current simulation state
        if sim_id in simulations_db:
            await websocket.send_text(json.dumps({
                "type": "simulation_state",
                "data": simulations_db[sim_id]
            }))
        else:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Simulation {sim_id} not found"
            }))
        
        # Keep connection alive and handle client messages
        while True:
            try:
                message = await websocket.receive_text()
                data = json.loads(message)
                
                # Handle client commands
                if data.get("action") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for simulation {sim_id}")
    except Exception as e:
        logger.error(f"WebSocket error for simulation {sim_id}: {e}")
    finally:
        # Remove from active connections
        if sim_id in active_connections and websocket in active_connections[sim_id]:
            active_connections[sim_id].remove(websocket)

@app.post("/api/pinn/train")
async def train_pinn_model(config: Dict[str, Any]):
    """Train a new PINN model"""
    try:
        model_id = config.get("model_id", str(uuid.uuid4()))
        
        # Create PINN configuration
        pinn_config = PINNConfig(
            layers=config.get("layers", [3, 50, 50, 50, 50, 4]),
            activation=config.get("activation", "tanh"),
            learning_rate=config.get("learning_rate", 0.001),
            epochs=config.get("epochs", 1000)
        )
        
        # Create blast parameters
        blast_params = pinn_engine.create_blast_params_from_config(config)
        
        # Train model
        metrics = await pinn_engine.create_and_train_model(
            model_id, pinn_config, blast_params
        )
        
        return {
            "model_id": model_id,
            "status": "completed",
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"PINN training error: {e}")
        raise HTTPException(status_code=500, detail=f"PINN training failed: {str(e)}")

@app.get("/api/urbanmesh")
async def get_urban_mesh(
    bbox: str,  # "lat1,lng1,lat2,lng2"
    include_buildings: bool = True,
    include_elevation: bool = True,
    use_real_data: bool = True
):
    """Fetch urban mesh data for given bounding box"""
    try:
        if use_real_data:
            # Use real-time data fetching
            return await get_real_time_urban_data(bbox)
        else:
            # Keep existing mock data logic
            coords = [float(x) for x in bbox.split(',')]
            if len(coords) != 4:
                raise ValueError("Invalid bounding box format")
            
            lat1, lng1, lat2, lng2 = coords
            
            # Mock mesh data (in production, this would fetch from OSM/OpenTopography)
            mesh_data = {
                "bbox": {"lat1": lat1, "lng1": lng1, "lat2": lat2, "lng2": lng2},
                "buildings": [],
                "elevation": [],
                "roads": []
            }
            
            if include_buildings:
                # Generate mock building data
                for i in range(10):
                    mesh_data["buildings"].append({
                        "id": f"building_{i}",
                        "coordinates": [
                            [lng1 + (lng2-lng1) * np.random.random(), lat1 + (lat2-lat1) * np.random.random()],
                            [lng1 + (lng2-lng1) * np.random.random(), lat1 + (lat2-lat1) * np.random.random()],
                            [lng1 + (lng2-lng1) * np.random.random(), lat1 + (lat2-lat1) * np.random.random()],
                            [lng1 + (lng2-lng1) * np.random.random(), lat1 + (lat2-lat1) * np.random.random()]
                        ],
                        "height": np.random.uniform(10, 100)
                    })
            
            if include_elevation:
                # Generate mock elevation data
                grid_size = 20
                for i in range(grid_size):
                    for j in range(grid_size):
                        lat = lat1 + (lat2 - lat1) * i / grid_size
                        lng = lng1 + (lng2 - lng1) * j / grid_size
                        elevation = np.random.uniform(0, 50)  # Mock elevation
                        
                        mesh_data["elevation"].append({
                            "lat": lat,
                            "lng": lng,
                            "elevation": elevation
                        })
            
            return mesh_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/real-time-urban-data")
async def get_real_time_data(bbox: str):
    """Fetch real-time urban data from OSM and elevation APIs"""
    return await get_real_time_urban_data(bbox)

@app.get("/api/simulations/{sim_id}/export")
async def export_simulation(sim_id: str, format: str = "csv"):
    """Export simulation data"""
    if sim_id not in simulations_db:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    simulation = simulations_db[sim_id]
    
    if format == "csv":
        # Generate CSV data
        csv_data = "frame,time,max_pressure,max_velocity\n"
        for frame_data in simulation["frames"]:
            csv_data += f"{frame_data['frame']},{frame_data['time']},{frame_data['max_pressure']},{frame_data['max_velocity']}\n"
        
        return StreamingResponse(
            iter([csv_data]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=simulation_{sim_id}.csv"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
