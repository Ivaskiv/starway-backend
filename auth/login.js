//api/auth/login.js

import { Router } from "express";
import { getUserByEmail, validatePassword } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user) return res.status(401).json({ error: "invalid" });

  const ok = await validatePassword(user, password);
  if (!ok) return res.status(401).json({ error: "invalid" });

  const access = signAccess(user.id);
  const refresh = signRefresh(user.id);

  await storeRefreshToken(user.id, refresh);

  res.json({ access, refresh, userId: user.id });
});

export default router;

