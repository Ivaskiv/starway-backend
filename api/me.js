// api/me.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const tgId = req.query.tg_id; // або з токена, або з headers

    if (!tgId) {
      return res.status(400).json({ error: 'tg_id is required' });
    }

    // 1) юзер
    const userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 LIMIT 1',
      [tgId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2) всі miniapps
    const miniappsRes = await pool.query('SELECT * FROM miniapps ORDER BY id');
    const miniapps = miniappsRes.rows;

    // 3) покупки
    const purchasesRes = await pool.query(
      'SELECT miniapp_id FROM purchases WHERE user_id = $1',
      [user.id]
    );
    const purchasedIds = purchasesRes.rows.map(r => r.miniapp_id);

    // 4) прогрес
    const progressRes = await pool.query(
      `SELECT miniapp_id, lesson_id, completed
       FROM progress
       WHERE user_id = $1`,
      [user.id]
    );

    res.json({
      user,
      miniapps: miniapps.map(app => ({
        ...app,
        is_unlocked: app.is_free || purchasedIds.includes(app.id),
      })),
      progress: progressRes.rows,
    });
  } catch (err) {
    console.error('GET /me error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
