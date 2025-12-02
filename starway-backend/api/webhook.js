import { pool } from "../db/client.js";
import { parseStartParam } from "../utils/helpers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tgId, startParam } = req.body;

    const parsed = parseStartParam(startParam);
    if (!parsed) return res.status(400).json({ error: "Invalid param" });

    const { courseId, source } = parsed;

    await pool.query(
      `
      INSERT INTO purchases (user_id, course_id, price, source)
      VALUES ((SELECT id FROM users WHERE tg_id=$1), $2, 0, $3)
      ON CONFLICT DO NOTHING
      `,
      [tgId, courseId, source]
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("webhook error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
