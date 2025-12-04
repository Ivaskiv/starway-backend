// api/miniapps.js
import express from 'express';
import { sql } from '../db/client.js';

const router = express.Router();

router.get('/:slug/manifest', async (req, res) => {
  try {
    const { slug } = req.params;
    const tgId = req.query.tg_id;

    const miniappRows = await sql`
      SELECT * FROM miniapps WHERE slug = ${slug} LIMIT 1
    `;
    const miniapp = miniappRows[0];

    if (!miniapp) {
      return res.status(404).json({ error: 'Miniapp not found' });
    }

    const lessons = await sql`
      SELECT id, title, video_url, short_text, full_text, tasks, order_index
      FROM lessons
      WHERE miniapp_id = ${miniapp.id}
      ORDER BY order_index ASC
    `;

    let progress = [];

    if (tgId) {
      const userRows = await sql`
        SELECT id FROM users WHERE telegram_id = ${tgId} LIMIT 1
      `;
      const user = userRows[0];

      if (user) {
        progress = await sql`
          SELECT lesson_id, completed
          FROM progress
          WHERE user_id = ${user.id} AND miniapp_id = ${miniapp.id}
        `;
      }
    }

    res.json({
      miniapp,
      lessons,
      progress
    });

  } catch (err) {
    console.error("GET /miniapps/:slug/manifest error", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
