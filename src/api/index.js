import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sql } from "../../db/client.js";

const app = express();
app.use(express.json());

// --- РЕЄСТРАЦІЯ ---
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [exists] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (exists) return res.status(409).json({ error: "email_exists" });

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`;
    const role = Number(count) === 0 ? "super_admin" : "user";

    const hash = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (${crypto.randomUUID()}, ${email}, ${hash}, ${name || email.split("@")[0]}, ${role})
      RETURNING id, email, name, role
    `;

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// --- ЛОГІН ---
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash FROM users WHERE email = ${email}
    `;

    if (!user) {
      console.log("LOGIN ERROR: user not found", email);
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log("LOGIN ERROR: password mismatch", { email, password, hash: user.password_hash });
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// --- РЕСЕТ ПАРОЛЯ СУПЕР-АДМІН ---
app.post("/auth/reset-superadmin-password", async (req, res) => {
  const password = req.body.password || "12345!"; // тимчасовий пароль
  const hash = await bcrypt.hash(password, 10);

  try {
    const updated = await sql`
      UPDATE users
      SET password_hash = ${hash}
      WHERE role = 'super_admin'
      RETURNING id, email, name
    `;
    res.json({ message: "Super admin password reset!", updated });
  } catch (err) {
    console.error("RESET SUPERADMIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default app;
