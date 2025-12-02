import { pool } from "../db/client.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const result = await pool.query(`
      SELECT id, title, video_url, short_text, full_text, badge
      FROM lessons
      ORDER BY id ASC
    `);

    res.status(200).json({ ok: true, lessons: result.rows });
  } catch (err) {
    console.error("lessons error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
