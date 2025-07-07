-- Initialize ShockWave Sim AI Database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    config JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Simulation frames table
CREATE TABLE IF NOT EXISTS simulation_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    time_step REAL NOT NULL,
    pressure_field JSONB,
    velocity_field JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(simulation_id, frame_number)
);

-- PINN models table
CREATE TABLE IF NOT EXISTS pinn_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    architecture JSONB NOT NULL,
    training_config JSONB NOT NULL,
    model_path VARCHAR(500),
    accuracy_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Urban mesh data table
CREATE TABLE IF NOT EXISTS urban_meshes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bbox JSONB NOT NULL, -- {lat1, lng1, lat2, lng2}
    buildings JSONB DEFAULT '[]',
    elevation JSONB DEFAULT '[]',
    roads JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_frames_simulation_id ON simulation_frames(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_frames_frame_number ON simulation_frames(frame_number);
CREATE INDEX IF NOT EXISTS idx_pinn_models_active ON pinn_models(is_active);

-- Insert sample PINN model
INSERT INTO pinn_models (name, version, architecture, training_config, accuracy_metrics) VALUES
(
    'DeepXDE Blast Wave Model',
    'v2.1',
    '{
        "type": "MLP",
        "layers": [3, 50, 50, 50, 50, 3],
        "activation": "tanh",
        "input_dim": 3,
        "output_dim": 3
    }',
    '{
        "epochs": 10000,
        "learning_rate": 0.001,
        "optimizer": "adam",
        "loss_weights": {"data": 1.0, "pde": 1.0, "bc": 10.0}
    }',
    '{
        "mse_pressure": 0.0023,
        "mse_velocity": 0.0156,
        "r2_score": 0.985,
        "validation_accuracy": 98.5
    }'
) ON CONFLICT DO NOTHING;

-- Insert sample user for development
INSERT INTO users (email) VALUES ('demo@shockwave-sim.ai') ON CONFLICT DO NOTHING;
