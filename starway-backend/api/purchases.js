import { pool } from "../db/client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId, courseId, price, source } = req.body;

    const result = await pool.query(
      `
      INSERT INTO purchases (user_id, course_id, price, source)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, courseId, price, source]
    );

    res.status(200).json({ ok: true, purchase: result.rows[0] });
  } catch (err) {
    console.error("purchases error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
