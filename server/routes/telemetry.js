import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware, gatewayAuthMiddleware } from "../middleware/auth.js";
import { broadcast } from "../ws.js";

const router = Router();

const inputSchema = z.object({
  deviceId: z.number().int(),
  tskin: z.number(),
  tamb: z.number(),
  tcore: z.number(),
  humidity: z.number().default(0),
  activityIndex: z.number().default(0),
  stressLevel: z.enum(["low", "moderate", "high", "critical"]),
  stressProb: z.number(),
  batteryVoltage: z.number(),
  batteryPct: z.number().int(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  gpsValid: z.boolean().default(false),
  hyperthermia: z.boolean().default(false),
});

router.get("/", authMiddleware, async (req, res) => {
  const rows = await getDb().listTelemetry(req.query);
  res.json(rows);
});

router.post("/", gatewayAuthMiddleware, async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().createTelemetry(parsed.data);
  broadcast("telemetry", row);

  if (row.stressLevel === "critical" || row.hyperthermia) {
    const alert = {
      type: row.hyperthermia ? "hyperthermia" : "critical_stress",
      severity: "critical",
      message: `${row.hyperthermia ? "Hyperthermia" : "Critical stress"} on device ${row.deviceId}`,
      deviceId: row.deviceId,
      subjectId: row.subjectId,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };
    await getDb().createAlert(alert);
    broadcast("alert", alert);
  }
  res.status(201).json(row);
});

router.get("/stats", authMiddleware, async (req, res) => {
  const stats = await getDb().telemetryStats(req.query);
  res.json(stats);
});

router.get("/chart", authMiddleware, async (req, res) => {
  const data = await getDb().telemetryChart(req.query);
  res.json(data);
});

export default router;
