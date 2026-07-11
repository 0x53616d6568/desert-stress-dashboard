import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware, generateToken } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });
  const { email, password } = parsed.data;

  const user = await getDb().findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
  });
});

router.post("/logout", (_req, res) => {
  res.status(204).send();
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt });
});

export default router;
