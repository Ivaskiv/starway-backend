// api/purchases.js
import { Router } from 'express';
import  pool  from '../db/client.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { user_id, product, source } = req.body;

    const result = await pool.query(
      `INSERT INTO purchases (user_id, product, source)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, product, source]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});

export default router;
