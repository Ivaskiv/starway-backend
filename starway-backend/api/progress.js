// api/progress.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

// POST /api/progress
// body: { user_id, lesson_id, completed }
router.post('/', async (req, res, next) => {
  try {
    const { user_id, lesson_id, completed } = req.body;

    if (!user_id || !lesson_id) {
      return res.status(400).json({ message: 'user_id і lesson_id обовʼязкові' });
    }

    const query = `
      INSERT INTO progress (user_id, lesson_id, completed)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [user_id, lesson_id, completed ?? true]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
