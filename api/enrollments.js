import express from "express";
import { verifyJwt } from "../utils/jwt.js";
import { createEnrollment } from "../models/enrollments.js";
import { getProductBySlug } from "../models/products.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { userId } = verifyJwt(token);

    const { product_slug, pay_source, pay_ref, expires_at } = req.body;

    const product = await getProductBySlug(product_slug);
    if (!product) return res.json({ error: "Product not found" });

    const enrollment = await createEnrollment({
      user_id: userId,
      product_id: product.id,
      pay_source,
      pay_ref,
      expires_at
    });

    res.json({ ok: true, enrollment });

  } catch (err) {
    console.error(err);
    res.json({ error: "Server error" });
  }
});

export default router;
