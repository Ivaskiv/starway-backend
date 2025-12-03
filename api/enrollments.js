// api/enrollments.js
import { Router } from "express";
import { getEnrollment, createEnrollment } from "../models/enrollments.js";
import { getProductBySlug } from "../models/products.js";
import { getUserByTelegramId } from "../models/users.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { telegram_id, product_slug, pay_ref, amount, currency, pay_source } = req.body;

    const user = await getUserByTelegramId(telegram_id);
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const product = await getProductBySlug(product_slug);
    if (!product) return res.status(404).json({ error: "product_not_found" });

    const enrollment = await createEnrollment({
      user_id: user.id,
      product_id: product.id,
      pay_source: pay_source || "manual",
      pay_ref,
      amount,
      currency,
      expires_at: null
    });

    res.json({ ok: true, enrollment });

  } catch (err) {
    console.error("POST /enrollments error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/:telegram_id/:product_slug", async (req, res) => {
  try {
    const { telegram_id, product_slug } = req.params;

    const user = await getUserByTelegramId(telegram_id);
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const product = await getProductBySlug(product_slug);
    if (!product) return res.status(404).json({ error: "product_not_found" });

    const enrollment = await getEnrollment(user.id, product.id);

    res.json(enrollment || null);

  } catch (err) {
    console.error("GET /enrollments error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
