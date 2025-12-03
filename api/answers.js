// api/answers.js
import { Router } from "express";
import { getLessonById } from "../models/lessons.js";
import { sql } from "../db/client.js";

const router = Router();

router.post("/", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  const { lesson_id, text } = req.body;
  if (!lesson_id || !text) return res.json({ error: "missing fields" });

  const lesson = await getLessonById(lesson_id);
  if (!lesson) return res.json({ error: "lesson not found" });

  await sql`
    INSERT INTO answers (user_id, lesson_id, raw_text, source)
    VALUES (${userId}, ${lesson_id}, ${text}, 'miniapp')
  `;

  await sql`
    UPDATE progress
    SET task_sent = true, updated_at = NOW()
    WHERE user_id = ${userId} AND lesson_id = ${lesson_id}
  `;

  res.json({ ok: true });
});

export default router;
