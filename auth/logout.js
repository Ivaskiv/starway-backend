// api/auth/logout.js

import { Router } from "express";
import { deleteRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  const { userId } = req.body;
  await deleteRefreshToken(userId);
  res.json({ ok: true });
});

export default router;
