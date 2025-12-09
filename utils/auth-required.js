// utils/auth-required.js
import { verifyAccess } from "./jwt.js";
import { sql } from "../db/client.js"; // для вибірки користувача з БД

export async function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "no_token" });

    const token = auth.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "no_token" });

    const decoded = verifyAccess(token);
    if (!decoded.userId) return res.status(401).json({ error: "invalid_token" });

    // ✅ отримуємо повного користувача
    const result = await sql`SELECT id, email, name, role FROM users WHERE id = ${decoded.userId}`;
    const user = result[0];
    if (!user) return res.status(401).json({ error: "user_not_found" });

    req.userId = user.id;
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token", message: err.message });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'access_denied' });
  }
  next();
}