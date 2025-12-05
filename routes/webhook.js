// routes/webhook.js
import express from 'express';
import { sql } from '../db/client.js';

const router = express.Router();

// ───────────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────────

async function findOrCreateUser({ email, telegram_id }) {
  if (!email && !telegram_id) {
    throw new Error('User identification required: email or telegram_id');
  }

  const client = await pool.connect();
  try {
    // 1) пробуємо знайти
    const res = await client.query(
      `
      SELECT * FROM users
      WHERE ($1::text IS NOT NULL AND email = $1)
         OR ($2::text IS NOT NULL AND telegram_id = $2)
      LIMIT 1
      `,
      [email || null, telegram_id || null]
    );

    if (res.rows[0]) return res.rows[0];

    // 2) створюємо
    const insert = await client.query(
      `
      INSERT INTO users (email, telegram_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [email || null, telegram_id || null]
    );

    return insert.rows[0];
  } finally {
    client.release();
  }
}

async function findMiniappByProduct(product) {
  if (!product) return null;

  const client = await pool.connect();
  try {
    // product типу "5funnel", "5points", "ai-mentor" і т.д.
    const res = await client.query(
      `
      SELECT * FROM miniapps
      WHERE slug = $1 OR code = $1
      LIMIT 1
      `,
      [product]
    );
    return res.rows[0] || null;
  } finally {
    client.release();
  }
}

// "paid-5funnel|source=tilda" → { status: 'paid', product: '5funnel', source: 'tilda' }
function parseStartParam(start) {
  if (!start) return {};

  const [statusAndProduct, sourcePart] = String(start).split('|');
  let status = null;
  let product = null;
  let source = null;

  if (statusAndProduct) {
    const [st, prod] = statusAndProduct.split('-'); // 'paid-5funnel'
    status = st || null;
    product = prod || null;
  }

  if (sourcePart && sourcePart.includes('=')) {
    const [, value] = sourcePart.split('=');
    source = value || null;
  }

  return { status, product, source };
}

// запис / оновлення покупки
async function upsertPurchase({ user_id, miniapp_id, source, external_id, status, amount, currency }) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      INSERT INTO purchases (user_id, miniapp_id, source, external_id, status, amount, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, miniapp_id)
      DO UPDATE SET
        source = EXCLUDED.source,
        external_id = EXCLUDED.external_id,
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency
      RETURNING *
      `,
      [
        user_id,
        miniapp_id,
        source || 'unknown',
        external_id || null,
        status || 'paid',
        amount || null,
        currency || null,
      ]
    );

    return res.rows[0];
  } finally {
    client.release();
  }
}

// ───────────────────────────────────────────────────────────────
// main endpoint /api/webhook
// ───────────────────────────────────────────────────────────────

// 1) WayForPay → POST JSON
// 2) Tilda / SendPulse → POST JSON з полем start: "paid-5funnel|source=tilda"
router.post('/', async (req, res) => {
  const payload = req.body || {};
  console.log('[webhook] incoming payload:', payload);

  try {
    // ─────────────────────────────────────────────
    // 1) WayForPay webhook
    // ─────────────────────────────────────────────
    // очікуємо:
    // { orderReference, merchantSignature, email, product, telegram_id, amount, currency }
    if (payload.orderReference && payload.merchantSignature) {
      const {
        orderReference,
        merchantSignature, // поки не валідуємо, можна додати пізніше
        email,
        product,
        telegram_id,
        amount,
        currency,
      } = payload;

      const user = await findOrCreateUser({ email, telegram_id });
      const miniapp = await findMiniappByProduct(product);

      if (!miniapp) {
        return res.status(400).json({
          ok: false,
          reason: 'UNKNOWN_PRODUCT',
          message: `No miniapp found for product="${product}"`,
        });
      }

      const purchase = await upsertPurchase({
        user_id: user.id,
        miniapp_id: miniapp.id,
        source: 'wayforpay',
        external_id: orderReference,
        status: 'paid',
        amount,
        currency,
      });

      return res.json({
        ok: true,
        source: 'wayforpay',
        user_id: user.id,
        miniapp_id: miniapp.id,
        purchase_id: purchase.id,
      });
    }

    // ─────────────────────────────────────────────
    // 2) Tilda success → через start=paid-5funnel|source=tilda
    //    Сюди ти можеш слати POST з Tilda / SendPulse:
    //    body: { start: "...", email, telegram_id }
    // ─────────────────────────────────────────────
    if (payload.start || payload.startParam) {
      const start = payload.start || payload.startParam;
      const { status, product, source } = parseStartParam(start);
      const { email, telegram_id } = payload;

      if (!product) {
        return res.status(400).json({
          ok: false,
          reason: 'INVALID_START_PARAM',
          message: `Cannot parse product from start="${start}"`,
        });
      }

      const user = await findOrCreateUser({ email, telegram_id });
      const miniapp = await findMiniappByProduct(product);

      if (!miniapp) {
        return res.status(400).json({
          ok: false,
          reason: 'UNKNOWN_PRODUCT',
          message: `No miniapp found for product="${product}" (from start param)`,
        });
      }

      const purchase = await upsertPurchase({
        user_id: user.id,
        miniapp_id: miniapp.id,
        source: source || 'tilda',
        external_id: null,
        status: status || 'paid',
        amount: null,
        currency: null,
      });

      return res.json({
        ok: true,
        source: source || 'tilda',
        user_id: user.id,
        miniapp_id: miniapp.id,
        purchase_id: purchase.id,
        start,
      });
    }

    // ─────────────────────────────────────────────
    // Якщо payload не підходить ні під один формат
    // ─────────────────────────────────────────────
    return res.status(400).json({
      ok: false,
      reason: 'UNSUPPORTED_PAYLOAD',
      message:
        'Webhook payload is not recognized. Expected WayForPay fields or { start: "paid-..." } from Tilda.',
    });
  } catch (err) {
    console.error('[webhook] error:', err);
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err.message || 'Unknown error',
    });
  }
});

export default router;
