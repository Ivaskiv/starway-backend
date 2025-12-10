// src/api/index.js — ОСТАТОЧНА ВЕРСІЯ, 100% ПРАЦЮЄ
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sql } from "../../db/client.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — дозволяємо все (поки що)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Middleware авторизації
const authRequired = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await sql`SELECT id, email, name, role FROM users WHERE id = ${decoded.id}`;
    if (!user) return res.status(401).json({ error: "user_not_found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
};

// Реєстрація
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [exists] = await sql`SELECT 1 FROM users WHERE email = ${email}`;
    if (exists) return res.status(409).json({ error: "email_exists" });

    const count = Number((await sql`SELECT COUNT(*) as c FROM users`)[0].c);
    const role = count === 0 ? "super_admin" : "user";

    const hash = await bcrypt.hash(password, 10);

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

// Логін
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash FROM users WHERE email = ${email}
    `;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Тест авторизації
app.get("/api/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get("/", (req, res) => {
  res.json({ message: "Starway Backend працює!" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend на http://localhost:${PORT}`);
  });
}

export default app;