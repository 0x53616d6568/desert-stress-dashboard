import pg from "pg";
import { logger } from "../utils/logger.js";
import { MemoryStore } from "../models/memoryStore.js";
import { seedMemory } from "../models/seed.js";
import { getAdminCredentials, logGeneratedCredentials } from "../utils/adminSeed.js";

const { Pool } = pg;

const SNAKE_MAP = {
  id: "id",
  email: "email",
  passwordHash: "password_hash",
  name: "name",
  role: "role",
  createdAt: "created_at",
  updatedAt: "updated_at",
  type: "type",
  status: "status",
  deviceId: "device_id",
  subjectId: "subject_id",
  notes: "notes",
  macAddress: "mac_address",
  firmwareVersion: "firmware_version",
  currentModelVersion: "current_model_version",
  lastSeen: "last_seen",
  batteryLevel: "battery_level",
  latitude: "latitude",
  longitude: "longitude",
  altitude: "altitude",
  timestamp: "timestamp",
  tskin: "tskin",
  tamb: "tamb",
  tcore: "tcore",
  humidity: "humidity",
  activityIndex: "activity_index",
  stressLevel: "stress_level",
  stressProb: "stress_prob",
  batteryVoltage: "battery_voltage",
  batteryPct: "battery_pct",
  gpsValid: "gps_valid",
  hyperthermia: "hyperthermia",
  severity: "severity",
  message: "message",
  acknowledged: "acknowledged",
  acknowledgedAt: "acknowledged_at",
  isActive: "is_active",
  tcoreMae: "tcore_mae",
  stressAuc: "stress_auc",
  trainingDate: "training_date",
  datasetId: "dataset_id",
  stressThreshold: "stress_threshold",
  stressProbCritical: "stress_prob_critical",
  nEstimators: "n_estimators",
  maxDepth: "max_depth",
  sampleCount: "sample_count",
  stressClassBalance: "stress_class_balance",
  source: "source",
  description: "description",
  fixesApplied: "fixes_applied",
  changelog: "changelog",
  releaseDate: "release_date",
  tcoreRaw: "tcore_raw",
  tcoreEstimated: "tcore_estimated",
  modelVersion: "model_version",
  confidence: "confidence",
  latencyMs: "latency_ms",
};

function camelToSnake(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = SNAKE_MAP[k] || k;
    out[key] = v;
  }
  return out;
}

function snakeToCamel(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = Object.keys(SNAKE_MAP).find((camel) => SNAKE_MAP[camel] === k) || k;
    out[key] = v;
  }
  return out;
}

export async function initDatabase() {
  if (process.env.DB_HOST) {
    try {
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      });
      await pool.query("SELECT NOW()");
      logger.info("Connected to PostgreSQL (Aiven)");
      global.db = new PostgresStore(pool);
      await global.db.initSchema();
      await global.db.seedDefaults();
      return;
    } catch (err) {
      logger.warn({ err }, "Aiven PostgreSQL unreachable, trying local fallback");
    }
  }

  if (process.env.LOCAL_DB_HOST) {
    try {
      const pool = new Pool({
        host: process.env.LOCAL_DB_HOST,
        port: Number(process.env.LOCAL_DB_PORT || 5432),
        database: process.env.LOCAL_DB_NAME,
        user: process.env.LOCAL_DB_USER,
        password: process.env.LOCAL_DB_PASSWORD,
        ssl: process.env.LOCAL_DB_SSL === "true",
      });
      await pool.query("SELECT NOW()");
      logger.info("Connected to PostgreSQL (local)");
      global.db = new PostgresStore(pool);
      await global.db.initSchema();
      await global.db.seedDefaults();
      return;
    } catch (err) {
      logger.warn({ err }, "Local PostgreSQL unreachable, falling back to memory store");
    }
  }

  logger.warn("PostgreSQL unavailable, using in-memory store (data will be lost on restart)");
  global.db = new MemoryStore();
  await seedMemory(global.db);
}

export function getDb() {
  if (!global.db) throw new Error("Database not initialized");
  return global.db;
}

class PostgresStore {
  constructor(pool) {
    this.pool = pool;
    this.mode = "postgres";
  }

  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows.map(snakeToCamel);
  }

  async one(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async initSchema() {
    const statements = [
      "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS subjects (id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('camel', 'human')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), device_id INTEGER, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS devices (id SERIAL PRIMARY KEY, mac_address TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')), firmware_version TEXT, current_model_version TEXT, last_seen TIMESTAMPTZ, battery_level INTEGER, latitude NUMERIC, longitude NUMERIC, subject_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS telemetry (id SERIAL PRIMARY KEY, device_id INTEGER NOT NULL, subject_id INTEGER, timestamp TIMESTAMPTZ DEFAULT NOW(), tskin NUMERIC NOT NULL, tamb NUMERIC NOT NULL, tcore NUMERIC NOT NULL, humidity NUMERIC NOT NULL DEFAULT 0, activity_index NUMERIC NOT NULL DEFAULT 0, stress_level TEXT NOT NULL CHECK (stress_level IN ('low', 'moderate', 'high', 'critical')), stress_prob NUMERIC NOT NULL, battery_voltage NUMERIC NOT NULL, battery_pct INTEGER NOT NULL, latitude NUMERIC, longitude NUMERIC, altitude NUMERIC, gps_valid BOOLEAN DEFAULT FALSE, hyperthermia BOOLEAN DEFAULT FALSE)",
      "CREATE TABLE IF NOT EXISTS alerts (id SERIAL PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('high_stress', 'critical_stress', 'hyperthermia', 'low_battery', 'device_offline', 'gateway_disconnected')), severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')), message TEXT NOT NULL, device_id INTEGER, subject_id INTEGER, acknowledged BOOLEAN DEFAULT FALSE, acknowledged_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS ai_models (id SERIAL PRIMARY KEY, name TEXT NOT NULL, version TEXT NOT NULL, is_active BOOLEAN DEFAULT FALSE, tcore_mae NUMERIC NOT NULL, stress_auc NUMERIC NOT NULL, training_date TIMESTAMPTZ, dataset_id INTEGER, stress_threshold NUMERIC, stress_prob_critical NUMERIC, n_estimators INTEGER, max_depth INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS datasets (id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('camel', 'human', 'real')), sample_count INTEGER NOT NULL, stress_class_balance NUMERIC NOT NULL, source TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS firmware (id SERIAL PRIMARY KEY, version TEXT NOT NULL UNIQUE, fixes_applied TEXT[] NOT NULL DEFAULT '{}', changelog TEXT, release_date TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW())",
      "CREATE TABLE IF NOT EXISTS inference_logs (id SERIAL PRIMARY KEY, device_id INTEGER NOT NULL, timestamp TIMESTAMPTZ DEFAULT NOW(), tcore_raw NUMERIC, tcore_estimated NUMERIC NOT NULL, stress_prob NUMERIC NOT NULL, stress_level TEXT NOT NULL CHECK (stress_level IN ('low', 'moderate', 'high', 'critical')), model_version TEXT NOT NULL, confidence NUMERIC NOT NULL, latency_ms NUMERIC)",
    ];
    for (const sql of statements) {
      await this.pool.query(sql);
    }
  }

  async seedDefaults() {
    const creds = getAdminCredentials();
    logGeneratedCredentials(creds);
    const { email, password } = creds;
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash(password, 10);
    const existing = await this.one("SELECT id FROM users WHERE email = $1", [email]);
    if (!existing) {
      await this.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)",
        [email, hash, "Admin", "admin"]
      );
      logger.info("Seeded default admin user");
    }
  }

  // Users
  async findUserByEmail(email) {
    return this.one("SELECT * FROM users WHERE email = $1", [email]);
  }
  async findUserById(id) {
    return this.one("SELECT * FROM users WHERE id = $1", [id]);
  }
  async createUser(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [row.email, row.password_hash, row.name, row.role || "operator"]
    );
  }

  // Subjects
  async listSubjects() {
    return this.query("SELECT * FROM subjects ORDER BY id DESC");
  }
  async findSubject(id) {
    return this.one("SELECT * FROM subjects WHERE id = $1", [id]);
  }
  async createSubject(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO subjects (name, type, status, device_id, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [row.name, row.type, row.status || "active", row.device_id || null, row.notes || null]
    );
  }
  async updateSubject(id, data) {
    const row = camelToSnake(data);
    const fields = Object.keys(row).filter((k) => row[k] !== undefined);
    if (fields.length === 0) return this.findSubject(id);
    const sets = fields.map((k, idx) => k + " = $" + (idx + 1)).join(", ");
    const values = fields.map((k) => row[k]);
    values.push(id);
    const sql = "UPDATE subjects SET " + sets + ", updated_at = NOW() WHERE id = $" + values.length + " RETURNING *";
    return this.one(sql, values);
  }
  async deleteSubject(id) {
    const res = await this.query("DELETE FROM subjects WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }

  // Devices
  async listDevices() {
    return this.query("SELECT * FROM devices ORDER BY id DESC");
  }
  async findDevice(id) {
    return this.one("SELECT * FROM devices WHERE id = $1", [id]);
  }
  async createDevice(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO devices (mac_address, name, status, firmware_version, subject_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [row.mac_address, row.name, row.status || "offline", row.firmware_version || null, row.subject_id || null]
    );
  }
  async updateDevice(id, data) {
    const row = camelToSnake(data);
    const fields = Object.keys(row).filter((k) => row[k] !== undefined);
    if (fields.length === 0) return this.findDevice(id);
    const sets = fields.map((k, idx) => k + " = $" + (idx + 1)).join(", ");
    const values = fields.map((k) => row[k]);
    values.push(id);
    const sql = "UPDATE devices SET " + sets + " WHERE id = $" + values.length + " RETURNING *";
    return this.one(sql, values);
  }
  async deleteDevice(id) {
    const res = await this.query("DELETE FROM devices WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }

  // Telemetry
  async listTelemetry({ deviceId, subjectId, limit = 100, offset = 0 } = {}) {
    const params = [];
    let sql = "SELECT * FROM telemetry WHERE 1=1";
    if (deviceId) { sql += " AND device_id = $" + (params.length + 1); params.push(Number(deviceId)); }
    if (subjectId) { sql += " AND subject_id = $" + (params.length + 1); params.push(Number(subjectId)); }
    sql += " ORDER BY timestamp DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(Number(limit), Number(offset));
    return this.query(sql, params);
  }
  async createTelemetry(data) {
    const row = camelToSnake(data);
    const result = await this.one(
      "INSERT INTO telemetry (device_id, subject_id, tskin, tamb, tcore, humidity, activity_index, stress_level, stress_prob, battery_voltage, battery_pct, latitude, longitude, altitude, gps_valid, hyperthermia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *",
      [
        row.device_id, row.subject_id || null, row.tskin, row.tamb, row.tcore, row.humidity, row.activity_index,
        row.stress_level, row.stress_prob, row.battery_voltage, row.battery_pct, row.latitude || null,
        row.longitude || null, row.altitude || null, row.gps_valid, row.hyperthermia,
      ]
    );
    if (row.device_id) {
      await this.query("UPDATE devices SET last_seen = NOW(), battery_level = $1 WHERE id = $2", [row.battery_pct, row.device_id]);
    }
    return result;
  }
  async telemetryStats({ deviceId, subjectId, hours = 24 } = {}) {
    const params = [];
    let sql = "SELECT AVG(tcore) as avg_tcore, AVG(tskin) as avg_tskin, AVG(tamb) as avg_tamb, AVG(battery_pct) as avg_battery, AVG(stress_prob) as avg_stress_prob, MAX(tcore) as max_tcore, MIN(tcore) as min_tcore, COUNT(*) FILTER (WHERE stress_level IN ('high','critical')) as stress_events, COUNT(*) as total, AVG(humidity) as avg_humidity, AVG(activity_index) as avg_activity FROM telemetry WHERE timestamp >= NOW() - INTERVAL '1 hour' * $" + (params.length + 1);
    params.push(Number(hours));
    if (deviceId) { sql += " AND device_id = $" + (params.length + 1); params.push(Number(deviceId)); }
    if (subjectId) { sql += " AND subject_id = $" + (params.length + 1); params.push(Number(subjectId)); }
    const r = await this.one(sql, params);
    return {
      avgTcore: Number(r?.avg_tcore || 0),
      avgTskin: Number(r?.avg_tskin || 0),
      avgTamb: Number(r?.avg_tamb || 0),
      avgBattery: Number(r?.avg_battery || 0),
      avgStressProb: Number(r?.avg_stress_prob || 0),
      maxTcore: Number(r?.max_tcore || 0),
      minTcore: Number(r?.min_tcore || 0),
      stressEvents: Number(r?.stress_events || 0),
      totalRecords: Number(r?.total || 0),
      avgHumidity: Number(r?.avg_humidity || 0),
      avgActivity: Number(r?.avg_activity || 0),
    };
  }
  async telemetryChart({ deviceId, subjectId, metric = "temperature", hours = 24 } = {}) {
    const keyMap = { temperature: "tcore", battery: "battery_pct", stress: "stress_prob", activity: "activity_index", humidity: "humidity" };
    const key = keyMap[metric] || "tcore";
    const params = [];
    let sql = "SELECT timestamp, " + key + " as value FROM telemetry WHERE timestamp >= NOW() - INTERVAL '1 hour' * $" + (params.length + 1);
    params.push(Number(hours));
    if (deviceId) { sql += " AND device_id = $" + (params.length + 1); params.push(Number(deviceId)); }
    if (subjectId) { sql += " AND subject_id = $" + (params.length + 1); params.push(Number(subjectId)); }
    sql += " ORDER BY timestamp ASC";
    return this.query(sql, params);
  }

  // Alerts
  async listAlerts({ acknowledged, limit = 50 } = {}) {
    const params = [];
    let sql = "SELECT * FROM alerts WHERE 1=1";
    if (acknowledged !== undefined) { sql += " AND acknowledged = $" + (params.length + 1); params.push(acknowledged); }
    sql += " ORDER BY created_at DESC LIMIT $" + (params.length + 1);
    params.push(Number(limit));
    return this.query(sql, params);
  }
  async createAlert(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO alerts (type, severity, message, device_id, subject_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [row.type, row.severity, row.message, row.device_id || null, row.subject_id || null]
    );
  }
  async acknowledgeAlert(id) {
    return this.one("UPDATE alerts SET acknowledged = TRUE, acknowledged_at = NOW() WHERE id = $1 RETURNING *", [id]);
  }

  // AI Models
  async listAiModels() {
    return this.query("SELECT * FROM ai_models ORDER BY created_at DESC");
  }
  async findAiModel(id) {
    return this.one("SELECT * FROM ai_models WHERE id = $1", [id]);
  }
  async createAiModel(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO ai_models (name, version, tcore_mae, stress_auc, dataset_id, stress_threshold, stress_prob_critical, n_estimators, max_depth) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [row.name, row.version, row.tcore_mae, row.stress_auc, row.dataset_id || null, row.stress_threshold || null, row.stress_prob_critical || null, row.n_estimators || null, row.max_depth || null]
    );
  }
  async updateAiModel(id, data) {
    const row = camelToSnake(data);
    const fields = Object.keys(row).filter((k) => row[k] !== undefined);
    if (fields.length === 0) return this.findAiModel(id);
    const sets = fields.map((k, idx) => k + " = $" + (idx + 1)).join(", ");
    const values = fields.map((k) => row[k]);
    values.push(id);
    const sql = "UPDATE ai_models SET " + sets + ", updated_at = NOW() WHERE id = $" + values.length + " RETURNING *";
    return this.one(sql, values);
  }
  async deleteAiModel(id) {
    const res = await this.query("DELETE FROM ai_models WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }
  async deployAiModel(id) {
    await this.query("UPDATE ai_models SET is_active = FALSE");
    return this.one("UPDATE ai_models SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *", [id]);
  }

  // Datasets
  async listDatasets() {
    return this.query("SELECT * FROM datasets ORDER BY created_at DESC");
  }
  async findDataset(id) {
    return this.one("SELECT * FROM datasets WHERE id = $1", [id]);
  }
  async createDataset(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO datasets (name, type, sample_count, stress_class_balance, source, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [row.name, row.type, row.sample_count, row.stress_class_balance, row.source, row.description || null]
    );
  }
  async updateDataset(id, data) {
    const row = camelToSnake(data);
    const fields = Object.keys(row).filter((k) => row[k] !== undefined);
    if (fields.length === 0) return this.findDataset(id);
    const sets = fields.map((k, idx) => k + " = $" + (idx + 1)).join(", ");
    const values = fields.map((k) => row[k]);
    values.push(id);
    const sql = "UPDATE datasets SET " + sets + " WHERE id = $" + values.length + " RETURNING *";
    return this.one(sql, values);
  }
  async deleteDataset(id) {
    const res = await this.query("DELETE FROM datasets WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }

  // Firmware
  async listFirmware() {
    return this.query("SELECT * FROM firmware ORDER BY release_date DESC");
  }
  async findFirmware(id) {
    return this.one("SELECT * FROM firmware WHERE id = $1", [id]);
  }
  async createFirmware(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO firmware (version, fixes_applied, changelog) VALUES ($1, $2, $3) RETURNING *",
      [row.version, row.fixes_applied || [], row.changelog || null]
    );
  }
  async updateFirmware(id, data) {
    const row = camelToSnake(data);
    const fields = Object.keys(row).filter((k) => row[k] !== undefined);
    if (fields.length === 0) return this.findFirmware(id);
    const sets = fields.map((k, idx) => k + " = $" + (idx + 1)).join(", ");
    const values = fields.map((k) => row[k]);
    values.push(id);
    const sql = "UPDATE firmware SET " + sets + " WHERE id = $" + values.length + " RETURNING *";
    return this.one(sql, values);
  }
  async deleteFirmware(id) {
    const res = await this.query("DELETE FROM firmware WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }
  async firmwareDeviceCount(version) {
    const r = await this.one("SELECT COUNT(*) as c FROM devices WHERE firmware_version = $1", [version]);
    return Number(r?.c || 0);
  }

  // Inference logs
  async listInferenceLogs({ deviceId, limit = 50 } = {}) {
    const params = [];
    let sql = "SELECT * FROM inference_logs WHERE 1=1";
    if (deviceId) { sql += " AND device_id = $" + (params.length + 1); params.push(Number(deviceId)); }
    sql += " ORDER BY timestamp DESC LIMIT $" + (params.length + 1);
    params.push(Number(limit));
    return this.query(sql, params);
  }
  async createInferenceLog(data) {
    const row = camelToSnake(data);
    return this.one(
      "INSERT INTO inference_logs (device_id, tcore_raw, tcore_estimated, stress_prob, stress_level, model_version, confidence, latency_ms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [row.device_id, row.tcore_raw || null, row.tcore_estimated, row.stress_prob, row.stress_level, row.model_version, row.confidence, row.latency_ms || null]
    );
  }
  async inferenceHealth() {
    const active = await this.one("SELECT * FROM ai_models WHERE is_active = TRUE");
    const r = await this.one("SELECT AVG(latency_ms) as avg_latency, COUNT(*) as stress_24h FROM inference_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND stress_level IN ('high','critical')");
    return {
      avgLatencyMs: Number(r?.avg_latency || 0).toFixed(1),
      stressDetectionsLast24h: Number(r?.stress_24h || 0),
      falsePositiveRate: 0.02,
      modelAccuracy7d: active ? active.stressAuc : 0.92,
      activeModelVersion: active ? active.version : null,
      activeModelAuc: active ? active.stressAuc : null,
    };
  }

  // Dashboard
  async dashboardSummary() {
    const active = await this.one("SELECT COUNT(*) as c FROM subjects WHERE status = 'active'");
    const critical = await this.one("SELECT COUNT(*) as c FROM telemetry WHERE stress_level = 'critical'");
    const hyper = await this.one("SELECT COUNT(*) as c FROM telemetry WHERE hyperthermia = TRUE");
    const online = await this.one("SELECT COUNT(*) as c FROM devices WHERE status = 'online'");
    const total = await this.one("SELECT COUNT(*) as c FROM devices");
    const alerts = await this.one("SELECT COUNT(*) as c FROM alerts WHERE acknowledged = FALSE");
    const dist = await this.query("SELECT stress_level, COUNT(*) as c FROM telemetry GROUP BY stress_level");
    const distribution = { low: 0, moderate: 0, high: 0, critical: 0 };
    dist.forEach((r) => { if (distribution[r.stressLevel] !== undefined) distribution[r.stressLevel] = Number(r.c); });
    return {
      activeSubjects: Number(active?.c || 0),
      criticalCount: Number(critical?.c || 0),
      alertCount: Number(alerts?.c || 0),
      hyperthermic: Number(hyper?.c || 0),
      onlineDevices: Number(online?.c || 0),
      totalDevices: Number(total?.c || 0),
      stressDistribution: distribution,
    };
  }
  async liveFeed() {
    const subjects = await this.query("SELECT * FROM subjects");
    const result = [];
    for (const s of subjects) {
      const latest = await this.one("SELECT * FROM telemetry WHERE subject_id = $1 ORDER BY timestamp DESC LIMIT 1", [s.id]);
      const device = await this.one("SELECT * FROM devices WHERE id = $1", [s.deviceId]);
      result.push({
        subjectId: s.id,
        subjectName: s.name,
        subjectType: s.type,
        deviceId: s.deviceId,
        stressLevel: latest ? latest.stressLevel : "low",
        tcore: latest ? Number(latest.tcore) : 0,
        tskin: latest ? Number(latest.tskin) : 0,
        tamb: latest ? Number(latest.tamb) : 0,
        battery: latest ? Number(latest.batteryPct) : (device ? Number(device.batteryLevel) : 0),
        latitude: latest ? Number(latest.latitude) : (device ? Number(device.latitude) : null),
        longitude: latest ? Number(latest.longitude) : (device ? Number(device.longitude) : null),
        lastSeen: latest ? latest.timestamp : (device ? device.lastSeen : null),
        isOnline: device ? device.status === "online" : false,
      });
    }
    return result;
  }
}
