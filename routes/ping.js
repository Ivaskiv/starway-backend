// api/ping.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    status: "alive",
    message: "pong",
    timestamp: Date.now(),
    env: process.env.NODE_ENV || "development"
  });
});

export default router;
