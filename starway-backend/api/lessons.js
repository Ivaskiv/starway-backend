// api/lessons.js
import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

// GET /api/lessons
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, slug, title, order_index, is_free FROM lessons ORDER BY order_index'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
