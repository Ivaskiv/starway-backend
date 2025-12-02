// api/webhook.js
import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  const { start } = req.body;

  // start = "paid-5funnel|tilda"
  const [purchasePart, source] = start.split('|');
  const product = purchasePart.replace('paid-', '');

  res.json({ product, source });
});

export default router;
