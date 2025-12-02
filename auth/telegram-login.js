// auth/telegram-login.js

import { Router } from "express";
import { verifyTelegramAuth } from "../utils/telegram.js";
import { getUserByTelegramId, createTelegramUser } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  const data = req.body;

  const ok = verifyTelegramAuth(data);
  if (!ok) return res.status(401).json({ error: "invalid_signature" });

  const tgId = data.id;
  let user = await getUserByTelegramId(tgId);

  if (!user) {
    user = await createTelegramUser({
      telegram_id: tgId,
      telegram_username: data.username,
      name: data.first_name,
      source: "telegram_login"
    });
  }

  const access = signAccess(user.id);
  const refresh = signRefresh(user.id);

  await storeRefreshToken(user.id, refresh);

  res.json({ access, refresh, userId: user.id });
});

export default router;
