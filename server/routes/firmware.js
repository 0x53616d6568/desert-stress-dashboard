import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

const inputSchema = z.object({
  version: z.string().min(1),
  fixesApplied: z.array(z.string()),
  changelog: z.string().nullable().optional(),
});

const updateSchema = inputSchema.partial();

router.get("/", authMiddleware, async (_req, res) => {
  const rows = await getDb().listFirmware();
  const withCounts = await Promise.all(
    rows.map(async (fw) => ({
      ...fw,
      deviceCount: await getDb().firmwareDeviceCount(fw.version),
    }))
  );
  res.json(withCounts);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const row = await getDb().findFirmware(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ ...row, deviceCount: await getDb().firmwareDeviceCount(row.version) });
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().createFirmware(parsed.data);
  res.status(201).json({ ...row, deviceCount: 0 });
});

router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().updateFirmware(req.params.id, parsed.data);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ ...row, deviceCount: await getDb().firmwareDeviceCount(row.version) });
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const ok = await getDb().deleteFirmware(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

export default router;
