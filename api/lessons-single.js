//api/lessons-single.js
import { Router } from "express";
import { getLessonById } from "../models/lessons.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const lesson = await getLessonById(id);

    if (!lesson) return res.status(404).json({ error: "lesson not found" });

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});

export default router;
