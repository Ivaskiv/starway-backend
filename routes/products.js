// routes/products.js
import { Router } from "express";
import { authRequired } from "../utils/auth-required.js";
import { sql } from "../db/client.js"; 

const router = Router();

// POST /api/products — створення нового продукту
router.post("/", authRequired, async (req, res) => {
  const {
    title,
    price = 0,
    description = "",
    type = "course",
    modules = [],
    free = false,
    trial = false,
    upsell = true,
  } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const [product] = await sql`
      INSERT INTO products (
        title, price, description, type, modules,
        free, trial, upsell, author_id, published
      ) VALUES (
        ${title},
        ${Number(price)},
        ${description},
        ${type},
        ${modules},
        ${free},
        ${trial},
        ${upsell},
        ${req.user.id},
        true
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("PRODUCT CREATE ERROR:", err);
    res.status(500).json({ error: "create_failed" });
  }
});

// GET /api/products — список усіх продуктів
router.get("/", authRequired, async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    res.json(products);
  } catch (err) {
    console.error("PRODUCTS LIST ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

export default router;