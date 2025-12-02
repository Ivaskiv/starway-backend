// api/miniapps.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

// Маніфест — опис продукту + уроки
router.get('/miniapps/:slug/manifest', async (req, res) => {
  try {
    const { slug } = req.params;
    const tgId = req.query.tg_id; // хто відкрив

    const miniappRes = await pool.query(
      'SELECT * FROM miniapps WHERE slug = $1 LIMIT 1',
      [slug]
    );
    const miniapp = miniappRes.rows[0];

    if (!miniapp) {
      return res.status(404).json({ error: 'Miniapp not found' });
    }

    // Уроки
    const lessonsRes = await pool.query(
      `SELECT id, title, badge, video_url, short_text, full_text, task, order_index
       FROM lessons
       WHERE miniapp_id = $1
       ORDER BY order_index ASC`,
      [miniapp.id]
    );

    let progress = [];
    if (tgId) {
      const userRes = await pool.query(
        'SELECT id FROM users WHERE telegram_id = $1 LIMIT 1',
        [tgId]
      );
      const user = userRes.rows[0];

      if (user) {
        const progRes = await pool.query(
          `SELECT lesson_id, completed
           FROM progress
           WHERE user_id = $1 AND miniapp_id = $2`,
          [user.id, miniapp.id]
        );
        progress = progRes.rows;
      }
    }

    res.json({
      miniapp,
      lessons: lessonsRes.rows,
      progress,
    });
  } catch (err) {
    console.error('GET /miniapps/:slug/manifest error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
