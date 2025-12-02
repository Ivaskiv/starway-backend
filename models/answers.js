import { sql } from "../db/client.js";

export async function saveAnswer({ userId, lessonId, text, source, payload }) {
  const rows = await sql`
    INSERT INTO answers (user_id, lesson_id, raw_text, source, payload)
    VALUES (${userId}, ${lessonId}, ${text}, ${source}, ${payload})
    RETURNING *
  `;
  return rows[0];
}
