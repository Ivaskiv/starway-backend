// api/auth/telegram.js
import { Router } from "express";
import { sql } from "../db/client.js";
import { signAccess } from "../utils/jwt.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { telegram_id, telegram_username, email, name } = req.body;

    if (!telegram_id && !email)
      return res.status(400).json({ error: "no_identifiers" });

    let user;

    const found = await sql`
      SELECT * FROM users
      WHERE telegram_id = ${telegram_id} OR email = ${email}
      LIMIT 1
    `;
    user = found[0];

    if (!user) {
      const created = await sql`
        INSERT INTO users (telegram_id, telegram_username, email, name, source)
        VALUES (${telegram_id}, ${telegram_username}, ${email}, ${name}, 'telegram')
        RETURNING *
      `;
      user = created[0];
    }

    const token = signAccess(user.id);

    res.json({ ok: true, token, user });

  } catch (err) {
    console.error("Telegram auth error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
