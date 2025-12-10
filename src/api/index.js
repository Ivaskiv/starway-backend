import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sql } from "../../db/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://starway-studio.vercel.app",
  "https://starway.pro",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, true); // тимчасово дозволяємо все
    },
    credentials: true,
  })
);

// ─── Middlewares ──────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Статичні файли
app.use(express.static(path.join(__dirname, "../public")));

// ─── Помилка сервера ─────────────
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "server_error", details: err.message });
});

// ─── Middleware авторизації ───────
async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await sql`SELECT id, email, name, role FROM users WHERE id = ${decoded.id}`;
    if (!user) return res.status(401).json({ error: "user_not_found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

// ─── РЕЄСТРАЦІЯ ─────────────────
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

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// ─── ЛОГІН ───────────────────────
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash
      FROM users
      WHERE email = ${email}
    `;

    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Перевіряємо пароль
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Генеруємо JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});



// ─── TELEGRAM AUTH ───────────────
app.post("/auth/telegram", async (req, res) => {
  const { telegram_id, first_name, last_name, username } = req.body;
  if (!telegram_id) return res.status(400).json({ error: "missing_telegram_id" });

  try {
    let [user] = await sql`SELECT * FROM users WHERE telegram_id = ${telegram_id}`;

    if (!user) {
      const name = [first_name, last_name].filter(Boolean).join(" ") || username || "Telegram User";
      [user] = await sql`
        INSERT INTO users (telegram_id, name, role)
        VALUES (${telegram_id}, ${name}, 'user')
        RETURNING id, name, role, telegram_id
      `;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, telegram_id },
    });
  } catch (err) {
    console.error("TELEGRAM AUTH ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Тест авторизації
app.get("/api/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// ─── Головна
app.get("/", (req, res) => {
  res.json({ message: "Starway Backend працює!", time: new Date().toISOString() });
});

// ─── Запуск локально
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Starway Backend запущено на http://localhost:${PORT}`);
  });
}

export default app;
