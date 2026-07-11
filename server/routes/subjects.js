import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const inputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["camel", "human"]),
  deviceId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const updateSchema = inputSchema.partial();

router.get("/", authMiddleware, async (_req, res) => {
  const rows = await getDb().listSubjects();
  res.json(rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const row = await getDb().findSubject(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.post("/", authMiddleware, async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().createSubject(parsed.data);
  res.status(201).json(row);
});

router.patch("/:id", authMiddleware, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().updateSubject(req.params.id, parsed.data);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const ok = await getDb().deleteSubject(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

export default router;
