// auth/register.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { getUserByEmail, getUserByTelegramId, createEmailUser } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";
import { sql } from "../db/client.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, password, telegram_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    let user = await getUserByEmail(email);
    
    if (!user && telegram_id) {
      user = await getUserByTelegramId(telegram_id);
    }

    if (user) {
      const hash = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users
        SET 
          name = ${name},
          email = COALESCE(email, ${email}),
          telegram_id = COALESCE(telegram_id, ${telegram_id}),
          password_hash = COALESCE(password_hash, ${hash}),
          updated_at = NOW()
        WHERE id = ${user.id}
      `;

      const access = signAccess(user.id);
      const refresh = signRefresh(user.id);
      await storeRefreshToken(user.id, refresh);

      return res.json({ ok: true, access, refresh, userId: user.id, updated: true });
    }

    user = await createEmailUser({ name, email, password });

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await storeRefreshToken(user.id, refresh);

    res.json({ ok: true, access, refresh, userId: user.id, created: true });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;