-- Desert Stress Monitor (DSM-CONTROL) PostgreSQL Schema
-- Camel/snake_case identifiers are used to match the JS server layer.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('camel', 'human')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  device_id INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  mac_address TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  firmware_version TEXT,
  current_model_version TEXT,
  last_seen TIMESTAMPTZ,
  battery_level INTEGER,
  latitude NUMERIC,
  longitude NUMERIC,
  subject_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL,
  subject_id INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tskin NUMERIC NOT NULL,
  tamb NUMERIC NOT NULL,
  tcore NUMERIC NOT NULL,
  humidity NUMERIC NOT NULL DEFAULT 0,
  activity_index NUMERIC NOT NULL DEFAULT 0,
  stress_level TEXT NOT NULL CHECK (stress_level IN ('low', 'moderate', 'high', 'critical')),
  stress_prob NUMERIC NOT NULL,
  battery_voltage NUMERIC NOT NULL,
  battery_pct INTEGER NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  altitude NUMERIC,
  gps_valid BOOLEAN DEFAULT FALSE,
  hyperthermia BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('high_stress', 'critical_stress', 'hyperthermia', 'low_battery', 'device_offline', 'gateway_disconnected')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  device_id INTEGER,
  subject_id INTEGER,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  tcore_mae NUMERIC NOT NULL,
  stress_auc NUMERIC NOT NULL,
  training_date TIMESTAMPTZ,
  dataset_id INTEGER,
  stress_threshold NUMERIC,
  stress_prob_critical NUMERIC,
  n_estimators INTEGER,
  max_depth INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('camel', 'human', 'real')),
  sample_count INTEGER NOT NULL,
  stress_class_balance NUMERIC NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firmware (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  fixes_applied TEXT[] NOT NULL DEFAULT '{}',
  changelog TEXT,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inference_logs (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tcore_raw NUMERIC,
  tcore_estimated NUMERIC NOT NULL,
  stress_prob NUMERIC NOT NULL,
  stress_level TEXT NOT NULL CHECK (stress_level IN ('low', 'moderate', 'high', 'critical')),
  model_version TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  latency_ms NUMERIC
);