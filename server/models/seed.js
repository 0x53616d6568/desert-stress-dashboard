import { getAdminCredentials, logGeneratedCredentials } from "../utils/adminSeed.js";

export async function seedMemory(store) {
  const creds = getAdminCredentials();
  logGeneratedCredentials(creds);
  const { email, password } = creds;
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.hash(password, 10);
  store.users.push({ id: 1, email, passwordHash: hash, name: "Admin", role: "admin", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

  store.subjects.push(
    { id: 1, name: "Camel-01", type: "camel", status: "active", deviceId: 1, notes: "Lead pack camel", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, name: "Operator-A", type: "human", status: "active", deviceId: 2, notes: "Field operator", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, name: "Camel-02", type: "camel", status: "active", deviceId: 3, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );

  store.devices.push(
    { id: 1, macAddress: "A4:CF:12:34:56:78", name: "Node-01", status: "online", firmwareVersion: "fw-2.1.4", currentModelVersion: "xgb-v1.2.0", lastSeen: new Date().toISOString(), batteryLevel: 87, latitude: 24.4539, longitude: 54.3773, subjectId: 1, createdAt: new Date().toISOString() },
    { id: 2, macAddress: "A4:CF:12:34:56:79", name: "Node-02", status: "online", firmwareVersion: "fw-2.1.4", currentModelVersion: "xgb-v1.2.0", lastSeen: new Date().toISOString(), batteryLevel: 72, latitude: 24.4545, longitude: 54.3780, subjectId: 2, createdAt: new Date().toISOString() },
    { id: 3, macAddress: "A4:CF:12:34:56:80", name: "Node-03", status: "offline", firmwareVersion: "fw-2.1.3", currentModelVersion: "xgb-v1.2.0", lastSeen: new Date(Date.now() - 3600 * 1000).toISOString(), batteryLevel: 12, latitude: 24.4530, longitude: 54.3760, subjectId: 3, createdAt: new Date().toISOString() }
  );

  store.aiModels.push(
    { id: 1, name: "XGBoost-Desert", version: "v1.2.0", isActive: true, tcoreMae: 0.15, stressAuc: 0.95, nEstimators: 120, maxDepth: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, name: "RandomForest-Heat", version: "v0.9.1", isActive: false, tcoreMae: 0.22, stressAuc: 0.91, nEstimators: 200, maxDepth: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );

  store.datasets.push(
    { id: 1, name: "Summer_Campaign_2023", type: "real", sampleCount: 12400, stressClassBalance: 0.48, source: "Field Ops", description: "Mixed camel and operator readings from July campaign", createdAt: new Date().toISOString() },
    { id: 2, name: "Camel_Lab_Validation", type: "camel", sampleCount: 5600, stressClassBalance: 0.35, source: "Lab Bench", description: "Controlled heat chamber validation", createdAt: new Date().toISOString() }
  );

  store.firmware.push(
    { id: 1, version: "fw-2.1.4", fixesApplied: ["Tcore offset fix", "LoRa power saving"], changelog: "Improved MAE by 0.03C and reduced TX power in idle.", releaseDate: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 2, version: "fw-2.1.3", fixesApplied: ["GPS cold-start fix"], changelog: "Fixed ublox M9 cold start in low signal.", releaseDate: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), createdAt: new Date().toISOString() }
  );

  const base = new Date(Date.now() - 6 * 3600 * 1000);
  for (let i = 0; i < 20; i++) {
    const deviceId = (i % 3) + 1;
    const subjectId = deviceId;
    const tskin = 35 + Math.random() * 4;
    const tamb = 38 + Math.random() * 8;
    const tcore = tskin + (Math.random() - 0.5) * 1.5;
    const stressProb = Math.min(1, Math.max(0, (tcore - 36) / 4 + Math.random() * 0.2));
    let stressLevel = "low";
    if (stressProb > 0.75) stressLevel = "critical";
    else if (stressProb > 0.55) stressLevel = "high";
    else if (stressProb > 0.35) stressLevel = "moderate";
    store.telemetry.push({
      id: 100 + i,
      deviceId,
      subjectId,
      timestamp: new Date(base.getTime() + i * 15 * 60 * 1000).toISOString(),
      tskin: Number(tskin.toFixed(2)),
      tamb: Number(tamb.toFixed(2)),
      tcore: Number(tcore.toFixed(2)),
      humidity: Number((20 + Math.random() * 30).toFixed(1)),
      activityIndex: Number(Math.random().toFixed(2)),
      stressLevel,
      stressProb: Number(stressProb.toFixed(3)),
      batteryVoltage: 3.6 + Math.random() * 0.4,
      batteryPct: Math.floor(40 + Math.random() * 60),
      latitude: 24.45 + Math.random() * 0.01,
      longitude: 54.37 + Math.random() * 0.01,
      altitude: 120 + Math.random() * 10,
      gpsValid: true,
      hyperthermia: tcore > 40.5,
    });
  }

  store.alerts.push(
    { id: 1, type: "critical_stress", severity: "critical", message: "Node-03 went offline for > 30 min", deviceId: 3, subjectId: 3, acknowledged: false, createdAt: new Date().toISOString() },
    { id: 2, type: "high_stress", severity: "warning", message: "Operator-A stress probability elevated", deviceId: 2, subjectId: 2, acknowledged: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 3, type: "low_battery", severity: "warning", message: "Node-03 battery below 15%", deviceId: 3, subjectId: 3, acknowledged: true, acknowledgedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() }
  );

  for (let i = 0; i < 10; i++) {
    store.inferenceLogs.push({
      id: 200 + i,
      deviceId: (i % 3) + 1,
      timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      tcoreRaw: 36.2 + Math.random() * 2,
      tcoreEstimated: 36.5 + Math.random() * 1.5,
      stressProb: Math.random(),
      stressLevel: ["low", "moderate", "high", "critical"][Math.floor(Math.random() * 4)],
      modelVersion: "xgb-v1.2.0",
      confidence: 0.85 + Math.random() * 0.14,
      latencyMs: 20 + Math.random() * 40,
    });
  }
}
