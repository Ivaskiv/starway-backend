// src/routes/auth.js — ВСЕ В ОДНОМУ ФАЙЛІ, НІЯКИХ ПОМИЛОК
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sql } from "../db/client.js";

const router = express.Router();

// Реєстрація (перший = super_admin)
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const [exists] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (exists) return res.status(409).json({ error: "email_exists" });

    const count = await sql`SELECT COUNT(*) as c FROM users`;
    const role = Number(count[0].c) === 0 ? "super_admin" : "user";

    const hash = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${hash}, ${name || email.split("@")[0]}, ${role})
      RETURNING id, email, name, role
    `;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Логін
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash 
      FROM users WHERE email = ${email}
    `;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Telegram-реєстрація
router.post("/telegram", async (req, res) => {
  const { telegram_id, telegram_username, first_name, last_name } = req.body;

  if (!telegram_id) return res.status(400).json({ error: "missing_telegram_id" });

  try {
    let [user] = await sql`SELECT * FROM users WHERE telegram_id = ${telegram_id}`;

    if (!user) {
      const name = `${first_name || ""} ${last_name || ""}`.trim() || telegram_username || "Telegram User";

      [user] = await sql`
        INSERT INTO users (telegram_id, telegram_username, name, role)
        VALUES (${telegram_id}, ${telegram_username}, ${name}, 'user')
        RETURNING id, email, name, role, telegram_id
      `;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email || null,
        name: user.name,
        role: user.role,
        telegram_id: user.telegram_id,
      },
    });
  } catch (err) {
    console.error("TELEGRAM AUTH ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Скидання пароля (простий варіант — генерує новий і надсилає на email)
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "missing_email" });

  try {
    const [user] = await sql`SELECT id, email, name FROM users WHERE email = ${email}`;
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const newPassword = crypto.randomBytes(8).toString("hex");
    const hash = await bcrypt.hash(newPassword, 10);

    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;

    // Тут ти можеш надіслати email з newPassword (nodemailer, resend, etc.)
    console.log(`Новий пароль для ${email}: ${newPassword}`);

    res.json({ message: "password_reset_sent" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;