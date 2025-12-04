// auth/refresh.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import { storeRefreshToken } from "../models/auth.js";
import { signAccess } from "../utils/jwt.js";

const router = Router();

router.post("/", async (req, res) => {
  const { refresh } = req.body;

  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const newAccess = signAccess(payload.id);

    return res.json({ access: newAccess });

  } catch (e) {
    return res.status(401).json({ error: "invalid_refresh" });
  }
});

export default router;
