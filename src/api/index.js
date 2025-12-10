// src/api/index.js
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sql } from "../../db/client.js";

const router = express.Router();

// --- РЕЄСТРАЦІЯ ---
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [exists] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (exists) return res.status(409).json({ error: "email_exists" });

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`;
    const role = Number(count) === 0 ? "super_admin" : "user";

    const hash = await bcrypt.hash(password, 12);

    const [user] = await sql`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (${crypto.randomUUID()}, ${email}, ${hash}, ${name || email.split("@")[0]}, ${role})
      RETURNING id, email, name, role
    `;

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// --- ЛОГІН ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash FROM users WHERE email = ${email}
    `;

    if (!user) return res.status(401).json({ error: "invalid_credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "invalid_credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// --- СКИНУТИ ПАРОЛЬ SUPER_ADMIN ---
router.post("/reset-superadmin-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: "missing_fields" });

  try {
    const [user] = await sql`SELECT id, role FROM users WHERE email = ${email}`;
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (user.role !== "super_admin") return res.status(403).json({ error: "not_superadmin" });

    const hash = await bcrypt.hash(newPassword, 12);

    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;

    res.json({ message: "Super admin password reset successful" });
  } catch (err) {
    console.error("RESET SUPERADMIN PASSWORD ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
