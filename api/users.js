// api/users.js
import { Router } from 'express';
import { pool } from '../db/client.js';

const router = Router();

// POST /api/users — створити або повернути user
router.post('/', async (req, res) => {
  try {
    const { tg_id, email, name } = req.body;

    if (!tg_id) return res.status(400).json({ error: "tg_id required" });

    const existing = await pool.query(
      `SELECT * FROM users WHERE tg_id = $1`,
      [tg_id]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO users (tg_id, email, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tg_id, email, name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;
