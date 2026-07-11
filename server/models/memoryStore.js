import { seedMemory } from "./seed.js";

let idCounter = 1;
function nextId() {
  return idCounter++;
}

export class MemoryStore {
  constructor() {
    this.mode = "memory";
    this.users = [];
    this.subjects = [];
    this.devices = [];
    this.telemetry = [];
    this.alerts = [];
    this.aiModels = [];
    this.datasets = [];
    this.firmware = [];
    this.inferenceLogs = [];
  }

  // Generic helpers
  _find(table, id) {
    return this[table].find((r) => r.id === Number(id)) || null;
  }

  _remove(table, id) {
    const idx = this[table].findIndex((r) => r.id === Number(id));
    if (idx >= 0) {
      this[table].splice(idx, 1);
      return true;
    }
    return false;
  }

  // Users
  async findUserByEmail(email) {
    return this.users.find((u) => u.email === email) || null;
  }
  async findUserById(id) {
    return this._find("users", id);
  }
  async createUser(data) {
    const user = { id: nextId(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.users.push(user);
    return user;
  }

  // Subjects
  async listSubjects() {
    return this.subjects;
  }
  async findSubject(id) {
    return this._find("subjects", id);
  }
  async createSubject(data) {
    const subject = { id: nextId(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.subjects.push(subject);
    return subject;
  }
  async updateSubject(id, data) {
    const s = this._find("subjects", id);
    if (!s) return null;
    Object.assign(s, data, { updatedAt: new Date().toISOString() });
    return s;
  }
  async deleteSubject(id) {
    return this._remove("subjects", id);
  }

  // Devices
  async listDevices() {
    return this.devices;
  }
  async findDevice(id) {
    return this._find("devices", id);
  }
  async createDevice(data) {
    const device = { id: nextId(), ...data, createdAt: new Date().toISOString() };
    this.devices.push(device);
    return device;
  }
  async updateDevice(id, data) {
    const d = this._find("devices", id);
    if (!d) return null;
    Object.assign(d, data);
    return d;
  }
  async deleteDevice(id) {
    return this._remove("devices", id);
  }

  // Telemetry
  async listTelemetry({ deviceId, subjectId, limit = 100, offset = 0 } = {}) {
    let rows = [...this.telemetry].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (deviceId) rows = rows.filter((r) => r.deviceId === Number(deviceId));
    if (subjectId) rows = rows.filter((r) => r.subjectId === Number(subjectId));
    return rows.slice(offset, offset + limit);
  }
  async createTelemetry(data) {
    const row = { id: nextId(), ...data, timestamp: data.timestamp || new Date().toISOString() };
    this.telemetry.push(row);
    if (this.telemetry.length > 10000) this.telemetry.shift();
    return row;
  }
  async telemetryStats({ deviceId, subjectId, hours = 24 } = {}) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    let rows = this.telemetry.filter((r) => r.timestamp >= since);
    if (deviceId) rows = rows.filter((r) => r.deviceId === Number(deviceId));
    if (subjectId) rows = rows.filter((r) => r.subjectId === Number(subjectId));
    if (rows.length === 0) {
      return { avgTcore: 0, avgTskin: 0, avgTamb: 0, avgBattery: 0, avgStressProb: 0, maxTcore: 0, minTcore: 0, stressEvents: 0, totalRecords: 0, avgHumidity: 0, avgActivity: 0 };
    }
    const avg = (key) => Number((rows.reduce((a, b) => a + Number(b[key]), 0) / rows.length).toFixed(2));
    return {
      avgTcore: avg("tcore"),
      avgTskin: avg("tskin"),
      avgTamb: avg("tamb"),
      avgBattery: avg("batteryPct"),
      avgStressProb: avg("stressProb"),
      maxTcore: Math.max(...rows.map((r) => r.tcore)),
      minTcore: Math.min(...rows.map((r) => r.tcore)),
      stressEvents: rows.filter((r) => ["high", "critical"].includes(r.stressLevel)).length,
      totalRecords: rows.length,
      avgHumidity: avg("humidity"),
      avgActivity: avg("activityIndex"),
    };
  }
  async telemetryChart({ deviceId, subjectId, metric = "temperature", hours = 24 } = {}) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    let rows = this.telemetry.filter((r) => r.timestamp >= since).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (deviceId) rows = rows.filter((r) => r.deviceId === Number(deviceId));
    if (subjectId) rows = rows.filter((r) => r.subjectId === Number(subjectId));
    const keyMap = {
      temperature: "tcore",
      battery: "batteryPct",
      stress: "stressProb",
      activity: "activityIndex",
      humidity: "humidity",
    };
    const key = keyMap[metric] || "tcore";
    return rows.map((r) => ({ timestamp: r.timestamp, value: Number(r[key]), label: null }));
  }

  // Alerts
  async listAlerts({ acknowledged, limit = 50 } = {}) {
    let rows = [...this.alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (acknowledged !== undefined) rows = rows.filter((r) => r.acknowledged === acknowledged);
    return rows.slice(0, limit);
  }
  async createAlert(data) {
    const row = { id: nextId(), ...data, acknowledged: false, createdAt: new Date().toISOString() };
    this.alerts.push(row);
    if (this.alerts.length > 1000) this.alerts.shift();
    return row;
  }
  async acknowledgeAlert(id) {
    const a = this._find("alerts", id);
    if (!a) return null;
    a.acknowledged = true;
    a.acknowledgedAt = new Date().toISOString();
    return a;
  }

  // AI Models
  async listAiModels() {
    return [...this.aiModels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async findAiModel(id) {
    return this._find("aiModels", id);
  }
  async createAiModel(data) {
    const row = { id: nextId(), ...data, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.aiModels.push(row);
    return row;
  }
  async updateAiModel(id, data) {
    const m = this._find("aiModels", id);
    if (!m) return null;
    Object.assign(m, data, { updatedAt: new Date().toISOString() });
    return m;
  }
  async deleteAiModel(id) {
    return this._remove("aiModels", id);
  }
  async deployAiModel(id) {
    const m = this._find("aiModels", id);
    if (!m) return null;
    this.aiModels.forEach((x) => (x.isActive = false));
    m.isActive = true;
    m.updatedAt = new Date().toISOString();
    return m;
  }

  // Datasets
  async listDatasets() {
    return [...this.datasets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async findDataset(id) {
    return this._find("datasets", id);
  }
  async createDataset(data) {
    const row = { id: nextId(), ...data, createdAt: new Date().toISOString() };
    this.datasets.push(row);
    return row;
  }
  async updateDataset(id, data) {
    const d = this._find("datasets", id);
    if (!d) return null;
    Object.assign(d, data);
    return d;
  }
  async deleteDataset(id) {
    return this._remove("datasets", id);
  }

  // Firmware
  async listFirmware() {
    return [...this.firmware].sort((a, b) => new Date(b.releaseDate || b.createdAt) - new Date(a.releaseDate || a.createdAt));
  }
  async findFirmware(id) {
    return this._find("firmware", id);
  }
  async createFirmware(data) {
    const row = { id: nextId(), ...data, releaseDate: data.releaseDate || new Date().toISOString(), createdAt: new Date().toISOString() };
    this.firmware.push(row);
    return row;
  }
  async updateFirmware(id, data) {
    const f = this._find("firmware", id);
    if (!f) return null;
    Object.assign(f, data);
    return f;
  }
  async deleteFirmware(id) {
    return this._remove("firmware", id);
  }
  async firmwareDeviceCount(version) {
    return this.devices.filter((d) => d.firmwareVersion === version).length;
  }

  // Inference logs
  async listInferenceLogs({ deviceId, limit = 50 } = {}) {
    let rows = [...this.inferenceLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (deviceId) rows = rows.filter((r) => r.deviceId === Number(deviceId));
    return rows.slice(0, limit);
  }
  async createInferenceLog(data) {
    const row = { id: nextId(), ...data, timestamp: data.timestamp || new Date().toISOString() };
    this.inferenceLogs.push(row);
    return row;
  }
  async inferenceHealth() {
    const activeModel = this.aiModels.find((m) => m.isActive);
    const logs = this.inferenceLogs.slice(0, 1000);
    const avgLatency = logs.length ? logs.reduce((a, b) => a + (b.latencyMs || 0), 0) / logs.length : 0;
    const stress24h = this.inferenceLogs.filter((l) => new Date(l.timestamp) > new Date(Date.now() - 24 * 3600 * 1000) && ["high", "critical"].includes(l.stressLevel)).length;
    return {
      avgLatencyMs: Number(avgLatency.toFixed(1)),
      stressDetectionsLast24h: stress24h,
      falsePositiveRate: 0.02,
      modelAccuracy7d: activeModel ? activeModel.stressAuc : 0.92,
      activeModelVersion: activeModel ? activeModel.version : null,
      activeModelAuc: activeModel ? activeModel.stressAuc : null,
    };
  }

  // Dashboard summaries
  async dashboardSummary() {
    const active = this.subjects.filter((s) => s.status === "active").length;
    const critical = this.telemetry.filter((t) => t.stressLevel === "critical").length;
    const hyperthermic = this.telemetry.filter((t) => t.hyperthermia).length;
    const online = this.devices.filter((d) => d.status === "online").length;
    const total = this.devices.length;
    const pendingAlerts = this.alerts.filter((a) => !a.acknowledged).length;
    const distribution = { low: 0, moderate: 0, high: 0, critical: 0 };
    this.telemetry.forEach((t) => { if (distribution[t.stressLevel] !== undefined) distribution[t.stressLevel]++; });
    return { activeSubjects: active, criticalCount: critical, alertCount: pendingAlerts, hyperthermic, onlineDevices: online, totalDevices: total, stressDistribution: distribution };
  }
  async liveFeed() {
    return this.subjects.map((s) => {
      const latest = this.telemetry
        .filter((t) => t.subjectId === s.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      const device = this.devices.find((d) => d.id === s.deviceId);
      return {
        subjectId: s.id,
        subjectName: s.name,
        subjectType: s.type,
        deviceId: s.deviceId,
        stressLevel: latest ? latest.stressLevel : "low",
        tcore: latest ? latest.tcore : 0,
        tskin: latest ? latest.tskin : 0,
        tamb: latest ? latest.tamb : 0,
        battery: latest ? latest.batteryPct : (device ? device.batteryLevel : 0),
        latitude: latest ? latest.latitude : (device ? device.latitude : null),
        longitude: latest ? latest.longitude : (device ? device.longitude : null),
        lastSeen: latest ? latest.timestamp : (device ? device.lastSeen : null),
        isOnline: device ? device.status === "online" : false,
      };
    });
  }
}
