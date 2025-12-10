// routes/users.js
import { Router } from "express";
import { sql } from "../db/client.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/users/telegram/:tgId
router.get("/telegram/:tgId", async (req, res) => {
  const { tgId } = req.params;
  try {
    const [user] = await sql`SELECT * FROM users WHERE telegram_id = ${tgId}`;
    res.json(user || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/users/create-telegram
router.post("/create-telegram", async (req, res) => {
  const { telegram_id, telegram_username, name } = req.body;

  if (!telegram_id) return res.status(400).json({ error: "missing_tg_id" });

  try {
    const [existing] = await sql`SELECT id FROM users WHERE telegram_id = ${telegram_id}`;
    if (existing) return res.status(409).json({ error: "already_exists" });

    const [user] = await sql`
      INSERT INTO users (telegram_id, telegram_username, name, role)
      VALUES (${telegram_id}, ${telegram_username}, ${name || "Telegram User"}, 'user')
      RETURNING id, telegram_id, telegram_username, name, role
    `;

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/users/create-email
router.post("/create-email", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing) return res.status(409).json({ error: "email_exists" });

    const hashed = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${hashed}, ${name || email.split("@")[0]}, 'user')
      RETURNING id, email, name, role
    `;

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;