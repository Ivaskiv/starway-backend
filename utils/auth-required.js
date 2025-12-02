// utils/auth-required.js

import { verifyAccess } from "./jwt.js";

export function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "no_token" });

  try {
    const decoded = verifyAccess(token);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
