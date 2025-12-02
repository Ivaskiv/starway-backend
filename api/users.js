// api/users.js
import { Router } from "express";
import {
  getUserByTelegramId,
  getUserByEmail,
  createTelegramUser,
  createEmailUser,
  validatePassword
} from "../models/users.js";

const router = Router();

router.get("/telegram/:tgId", async (req, res) => {
  const tgId = req.params.tgId;
  const user = await getUserByTelegramId(tgId);
  res.json(user || null);
});

router.post("/create-telegram", async (req, res) => {
  const { telegram_id, telegram_username, name, source } = req.body;

  const user = await createTelegramUser({
    telegram_id,
    telegram_username,
    name,
    source
  });

  res.json(user);
});

router.post("/create-email", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await getUserByEmail(email);
  if (exists) return res.status(409).json({ error: "Email exists" });

  const user = await createEmailUser({ name, email, password });
  res.json(user);
});

router.post("/check-password", async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user) return res.json({ ok: false });

  const valid = await validatePassword(user, password);
  res.json({ ok: valid, user: valid ? user : null });
});

export default router;
