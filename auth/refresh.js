// auth/refresh.js

import { Router } from "express";
import { verifyRefresh, signAccess, signRefresh } from "../utils/jwt.js";
import { getRefreshToken, storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(401).json({ error: "missing" });

  let decoded;
  try {
    decoded = verifyRefresh(refresh);
  } catch {
    return res.status(401).json({ error: "invalid" });
  }

  const stored = await getRefreshToken(decoded.userId);
  if (!stored || stored !== refresh) return res.status(401).json({ error: "invalid" });

  const newAccess = signAccess(decoded.userId);
  const newRefresh = signRefresh(decoded.userId);

  await storeRefreshToken(decoded.userId, newRefresh);

  res.json({ access: newAccess, refresh: newRefresh });
});

export default router;
