// utils/auth-required.js

import jwt from "jsonwebtoken";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "invalid_token" });
    }

    if (!decoded.userId) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const client = await pool.connect();
    const { rows } = await client.query(
      "SELECT id, email, name, role FROM users WHERE id=$1",
      [decoded.userId]
    );
    client.release();

    if (!rows.length) {
      return res.status(401).json({ error: "user_not_found" });
    }

    req.user = rows[0];
    req.userId = rows[0].id;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "server_error" });
  }
}