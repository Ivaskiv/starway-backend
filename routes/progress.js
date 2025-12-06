// routes/progress.js
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
  const userId = req.userId;
  const { lesson_id } = req.body;

  try {
    const lesson = await getLessonById(lesson_id);
    if (!lesson) {
      return res.status(404).json({ error: "lesson_not_found" });
    }

    await setWatched(userId, lesson.product_id, lesson.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Watch error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/complete", async (req, res) => {
  const userId = req.userId;
  const { lesson_id } = req.body;

  try {
    const lesson = await getLessonById(lesson_id);
    if (!lesson) {
      return res.status(404).json({ error: "lesson_not_found" });
    }

    await completeLesson(userId, lesson.product_id, lesson.id);

    const next = await getNextLesson(lesson.product_id, lesson.lesson_number);
    if (next) {
      await unlockLesson(userId, lesson.product_id, next.id);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;