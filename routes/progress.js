// api/progress.js
import { Router } from "express";
import { getLessonById } from "../models/lessons.js";
import {
  setWatched,
  completeLesson,
  unlockLesson,
  getNextLesson
} from "../models/progress.js";

const router = Router();

router.post("/watch", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { lesson_id } = req.body;

  const lesson = await getLessonById(lesson_id);
  if (!lesson) return res.json({ error: "lesson not found" });

  await setWatched(userId, lesson.product_id, lesson.id);
  res.json({ ok: true });
});

router.post("/complete", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { lesson_id } = req.body;

  const lesson = await getLessonById(lesson_id);
  if (!lesson) return res.json({ error: "lesson not found" });

  await completeLesson(userId, lesson.product_id, lesson.id);

  const next = await getNextLesson(lesson.product_id, lesson.lesson_number);
  if (next) {
    await unlockLesson(userId, lesson.product_id, next.id);
  }

  res.json({ ok: true });
});

export default router;
