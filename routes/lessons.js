// routes/lessons.js
import { Router } from "express";
import { sql } from "../db/client.js";

const router = Router();

router.get("/", async (req, res) => {
  const lessons = await sql`
    SELECT * FROM lessons ORDER BY order_index ASC;
  `;

  res.json(lessons);
});

router.get("/:slug", async (req, res) => {
  const slug = req.params.slug;

  const rows = await sql`
    SELECT * FROM lessons WHERE slug = ${slug} LIMIT 1;
  `;

  res.json(rows[0] || null);
});

export default router;
