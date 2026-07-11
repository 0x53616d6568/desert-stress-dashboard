import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const inputSchema = z.object({
  macAddress: z.string().min(1),
  name: z.string().min(1),
  firmwareVersion: z.string().nullable().optional(),
  subjectId: z.number().int().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["online", "offline", "maintenance"]).optional(),
  firmwareVersion: z.string().nullable().optional(),
  subjectId: z.number().int().nullable().optional(),
  batteryLevel: z.number().int().min(0).max(100).nullable().optional(),
});

router.get("/", authMiddleware, async (_req, res) => {
  const rows = await getDb().listDevices();
  res.json(rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const row = await getDb().findDevice(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.post("/", authMiddleware, async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().createDevice({ ...parsed.data, status: "offline" });
  res.status(201).json(row);
});

router.patch("/:id", authMiddleware, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().updateDevice(req.params.id, parsed.data);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const ok = await getDb().deleteDevice(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

export default router;
