// api/purchases.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

// POST /api/purchases
// body: { user_id, product_code, source, raw }
router.post('/', async (req, res, next) => {
  try {
    const { user_id, product_code, source, raw } = req.body;

    if (!user_id || !product_code) {
      return res.status(400).json({ message: 'user_id і product_code обовʼязкові' });
    }

    const query = `
      INSERT INTO purchases (user_id, product_code, source, raw_payload)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      user_id,
      product_code,
      source || 'unknown',
      raw ? JSON.stringify(raw) : null,
    ]);

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
