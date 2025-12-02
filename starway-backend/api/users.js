import { pool } from "../db/client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tgId, email, name, source } = req.body;

    const result = await pool.query(
      `INSERT INTO users (tg_id, email, name, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tg_id)
       DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      [tgId, email, name, source]
    );

    res.status(200).json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error("users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
