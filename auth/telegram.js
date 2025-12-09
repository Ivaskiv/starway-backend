// auth/telegram.js
import express from "express";
import { findUserByTelegram, updateTelegram, createUser } from "../models/users.js";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  const { telegramId, data } = req.body;

  if (!telegramId) return res.status(400).json({ error: "missing_tg_id" });

  let user = await findUserByTelegram(telegramId);

  if (!user) {
    user = await createUser({
      id: crypto.randomUUID(),
      email: null,
      password_hash: null,
      name: data?.first_name || "Telegram User",
      role: "user",
    });

    await updateTelegram(user.id, telegramId, data);
  }

  res.json({ user });
});

export default router;
