// routes/practicums.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  const { title, description, category, duration_days, price, steps } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO practicums (title, description, category, duration_days, price, steps, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, category, duration_days, price, JSON.stringify(steps), req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка збереження' });
  }
});

module.exports = router;