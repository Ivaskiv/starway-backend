// api/webhook.js
import express from 'express';

const router = express.Router();

// POST /api/webhook
router.post('/', async (req, res) => {
  // тут потім розберемо підпис Wayforpay і start=paid-5funnel|source=tilda
  console.log('Webhook payload:', req.body);
  res.json({ ok: true });
});

export default router;
