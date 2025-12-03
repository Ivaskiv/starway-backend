// api/payments/wayforpay.js

import { Router } from "express";
import { getUserByTelegramId } from "../../models/users.js";
import { getProductBySlug } from "../../models/products.js";
import { createEnrollment } from "../../models/enrollments.js";
import { logPayment } from "../../models/payments.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const telegramId = data?.customParameters?.telegram_id;
    const productSlug = data?.customParameters?.product_slug;
    const pay_ref = data.orderReference;
    const amount = data.amount;
    const currency = data.currency;
    const expires_at = null;

    if (!telegramId || !productSlug) return res.json({ ok: false });

    const user = await getUserByTelegramId(telegramId);
    if (!user) return res.json({ ok: false });

    const product = await getProductBySlug(productSlug);
    if (!product) return res.json({ ok: false });

    await createEnrollment({
      user_id: user.id,
      product_id: product.id,
      pay_source: "wayforpay",
      pay_ref,
      amount,
      currency,
      expires_at
    });

    await logPayment({
      source: "wayforpay",
      event_type: "payment_success",
      external_id: pay_ref,
      user_id: user.id,
      payload: data
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.json({ ok: false });
  }
});

export default router;
