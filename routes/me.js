// routes/me.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import { sql } from "../db/client.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "missing_token" });

    const token = auth.replace("Bearer ", "").trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.userId || payload.id;

    const rows = await sql`
      SELECT id, name, email, telegram_id, telegram_username
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (!rows.length) return res.status(404).json({ error: "user_not_found" });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;