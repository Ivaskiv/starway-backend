// api/lessons.js
import { Router } from "express";
import { verifyJwt } from "../utils/jwt.js";
import {
  getProductBySlug,
  getLessonsByProduct,
  getUserLessonProgress,
  hasActiveEnrollment
} from "../models/lessons.js";
import { sql } from "../db/client.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { userId } = verifyJwt(token);

    const productSlug = req.query.product;
    if (!productSlug) return res.status(400).json({ error: "product slug required" });

    const product = await getProductBySlug(productSlug);
    if (!product) return res.status(404).json({ error: "product not found" });

    const lessons = await getLessonsByProduct(product.id);
    const progress = await getUserLessonProgress(userId, product.id);
    const access = await hasActiveEnrollment(userId, product.id);

    const list = lessons.map(lesson => {
      const p = progress.find(r => r.lesson_id === lesson.id);

      let status = "locked";
      if (lesson.is_free) status = "open";
      if (access) status = "open";
      if (p?.completed) status = "completed";
      if (p?.status === "open") status = "open";

      return {
        id: lesson.id,
        title: lesson.title,
        video: lesson.video_url,
        short_text: lesson.short_text,
        full_text: lesson.full_text,
        tasks: lesson.tasks,
        lesson_number: lesson.lesson_number,
        is_free: lesson.is_free,
        status
      };
    });

    res.json({
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title
      },
      lessons: list
    });

  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});

export default router;
