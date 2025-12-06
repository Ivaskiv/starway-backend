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

  const users = await sql`
    SELECT * FROM users
    WHERE (${email}::text IS NOT NULL AND email = ${email})
       OR (${telegram_id}::text IS NOT NULL AND telegram_id = ${telegram_id})
    LIMIT 1
  `;

  if (users[0]) return users[0];

  const newUsers = await sql`
    INSERT INTO users (email, telegram_id, source)
    VALUES (${email}, ${telegram_id}, 'webhook')
    RETURNING *
  `;

  return newUsers[0];
}

async function findMiniappByProduct(product) {
  if (!product) return null;

  const miniapps = await sql`
    SELECT * FROM miniapps
    WHERE slug = ${product} OR code = ${product}
    LIMIT 1
  `;
  
  return miniapps[0] || null;
}

function parseStartParam(start) {
  if (!start) return {};

  const [statusAndProduct, sourcePart] = String(start).split('|');
  let status = null;
  let product = null;
  let source = null;

  if (statusAndProduct) {
    const [st, prod] = statusAndProduct.split('-');
    status = st || null;
    product = prod || null;
  }

  if (sourcePart && sourcePart.includes('=')) {
    const [, value] = sourcePart.split('=');
    source = value || null;
  }

  return { status, product, source };
}

async function upsertPurchase({ user_id, miniapp_id, source, external_id, status, amount, currency }) {
  const purchases = await sql`
    INSERT INTO purchases (user_id, miniapp_id, source, external_id, status, amount, currency)
    VALUES (${user_id}, ${miniapp_id}, ${source || 'unknown'}, ${external_id}, ${status || 'paid'}, ${amount}, ${currency})
    ON CONFLICT (user_id, miniapp_id)
    DO UPDATE SET
      source = EXCLUDED.source,
      external_id = EXCLUDED.external_id,
      status = EXCLUDED.status,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency
    RETURNING *
  `;

  return purchases[0];
}

// ───────────────────────────────────────────────────────────────
// main endpoint /api/webhook
// ───────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const payload = req.body || {};
  console.log('[webhook] incoming payload:', payload);

  try {
    // ─────────────────────────────────────────────
    // 1) WayForPay webhook
    // ─────────────────────────────────────────────
    if (payload.orderReference && payload.merchantSignature) {
      const {
        orderReference,
        merchantSignature,
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

    return res.status(400).json({
      ok: false,
      reason: 'UNSUPPORTED_PAYLOAD',
      message: 'Webhook payload is not recognized.',
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