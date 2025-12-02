import { pool } from "../db/client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId, lessonId } = req.body;

    const result = await pool.query(
      `
      INSERT INTO user_progress (user_id, lesson_id, completed)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed = TRUE
      RETURNING *
      `,
      [userId, lessonId]
    );

    res.status(200).json({ ok: true, progress: result.rows[0] });
  } catch (err) {
    console.error("progress error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
