// api/users.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

// POST /api/users
// body: { telegram_id, username, name, email }
router.post('/', async (req, res, next) => {
  try {
    const { telegram_id, username, name, email } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ message: 'telegram_id обовʼязковий' });
    }

    const query = `
      INSERT INTO users (telegram_id, username, name, email)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_id)
      DO UPDATE SET username = EXCLUDED.username,
                   name     = EXCLUDED.name,
                   email    = EXCLUDED.email,
                   updated_at = NOW()
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      telegram_id,
      username || null,
      name || null,
      email || null,
    ]);

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
