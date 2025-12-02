// api/progress.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

/**
 * POST /api/progress
 * body: { tg_id, miniapp_slug, lesson_id, completed? }
 *
 * Зберігаємо / оновлюємо прогрес по уроку
 */
router.post('/', async (req, res) => {
  try {
    const { tg_id, miniapp_slug, lesson_id, completed } = req.body;

    if (!tg_id || !miniapp_slug || !lesson_id) {
      return res
        .status(400)
        .json({ error: 'tg_id, miniapp_slug, lesson_id required' });
    }

    // 1) шукаємо або створюємо юзера по telegram_id
    const userRes = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1 LIMIT 1',
      [tg_id]
    );
    let user = userRes.rows[0];

    if (!user) {
      const insertUser = await pool.query(
        'INSERT INTO users (telegram_id) VALUES ($1) RETURNING id',
        [tg_id]
      );
      user = insertUser.rows[0];
    }

    // 2) шукаємо miniapp по slug
    const miniappRes = await pool.query(
      'SELECT id FROM miniapps WHERE slug = $1 LIMIT 1',
      [miniapp_slug]
    );
    const miniapp = miniappRes.rows[0];

    if (!miniapp) {
      return res.status(400).json({ error: 'Unknown miniapp_slug' });
    }

    // 3) upsert прогресу
    await pool.query(
      `INSERT INTO progress (user_id, miniapp_id, lesson_id, completed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, miniapp_id, lesson_id)
       DO UPDATE SET completed = EXCLUDED.completed`,
      [user.id, miniapp.id, lesson_id, completed ?? true]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/progress error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/progress?tg_id=...&miniapp_slug=...
 * щоб Mini App могла забрати прогрес по всіх уроках
 */
router.get('/', async (req, res) => {
  try {
    const { tg_id, miniapp_slug } = req.query;

    if (!tg_id || !miniapp_slug) {
      return res
        .status(400)
        .json({ error: 'tg_id and miniapp_slug are required' });
    }

    const userRes = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1 LIMIT 1',
      [tg_id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.json({ ok: true, items: [] });
    }

    const miniappRes = await pool.query(
      'SELECT id FROM miniapps WHERE slug = $1 LIMIT 1',
      [miniapp_slug]
    );
    const miniapp = miniappRes.rows[0];

    if (!miniapp) {
      return res.status(400).json({ error: 'Unknown miniapp_slug' });
    }

    const progRes = await pool.query(
      `SELECT lesson_id, completed, updated_at
       FROM progress
       WHERE user_id = $1 AND miniapp_id = $2
       ORDER BY lesson_id ASC`,
      [user.id, miniapp.id]
    );

    return res.json({
      ok: true,
      items: progRes.rows,
    });
  } catch (err) {
    console.error('GET /api/progress error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
