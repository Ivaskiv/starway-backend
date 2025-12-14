// routes/products.js
import { Router } from "express";
import { authRequired } from "../utils/auth-required.js";
import { sql } from "../db/client.js";
import { randomUUID } from "crypto";

const router = Router();

// POST /api/products — створення продукту з блоками
router.post("/", authRequired, async (req, res) => {
  const {
    title,
    description = "",
    type = "course",
    category = "personal_growth",
    duration_days = 7,
    price = 0,
    access_type = "one_time",
    blocks = [],
    modules = [],
    free = false,
    trial = false,
    upsell = true,
  } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    // Створити продукт
    const [product] = await sql`
      INSERT INTO products (
        title, price, description, type, category, duration_days, 
        access_type, modules, free, trial, upsell, author_id, published
      ) VALUES (
        ${title},
        ${Number(price)},
        ${description},
        ${type},
        ${category},
        ${duration_days},
        ${access_type},
        ${modules},
        ${free},
        ${trial},
        ${upsell},
        ${req.user.id},
        true
      )
      RETURNING *
    `;

    // Додати блоки якщо є
    if (blocks && blocks.length > 0) {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockId = randomUUID(); 
        
        await sql`
          INSERT INTO blocks (
            id, product_id, type, title, content, order_index,
            duration_minutes, points, deadline_hours, settings
          ) VALUES (
            ${blockId},
            ${product.id},
            ${block.type},
            ${block.title},
            ${block.content},
            ${i + 1},
            ${block.duration || 15},
            ${block.points || 0},
            ${block.deadline_hours || null},
            ${JSON.stringify(block.settings || {})}
          )
        `;
      }
    }

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
    const products = await sql`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `;
    res.json(products);
  } catch (err) {
    console.error("PRODUCTS LIST ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

// GET /api/products/:id — один продукт з блоками
router.get("/:id", authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (!product) {
      return res.status(404).json({ error: "not_found" });
    }

    const blocks = await sql`
      SELECT * FROM blocks 
      WHERE product_id = ${id}
      ORDER BY order_index
    `;

    res.json({
      ...product,
      blocks,
    });
  } catch (err) {
    console.error("PRODUCT FETCH ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

// GET /api/products/:id/blocks — блоки продукту з прогресом
router.get("/:id/blocks", authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const blocks = await sql`
      SELECT 
        b.*,
        bc.completed,
        bc.user_answer,
        bc.file_url,
        bc.mentor_feedback,
        bc.completed_at
      FROM blocks b
      LEFT JOIN block_completions bc 
        ON b.id = bc.block_id AND bc.user_id = ${req.user.id}
      WHERE b.product_id = ${id}
      ORDER BY b.order_index
    `;

    res.json(blocks);
  } catch (err) {
    console.error("BLOCKS FETCH ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

// PATCH /api/products/:id — оновити продукт
router.patch("/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    price,
    category,
    duration_days,
    access_type,
    published,
  } = req.body;

  try {
    const [product] = await sql`
      UPDATE products SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        price = COALESCE(${price}, price),
        category = COALESCE(${category}, category),
        duration_days = COALESCE(${duration_days}, duration_days),
        access_type = COALESCE(${access_type}, access_type),
        published = COALESCE(${published}, published),
        updated_at = NOW()
      WHERE id = ${id} AND author_id = ${req.user.id}
      RETURNING *
    `;

    if (!product) {
      return res.status(404).json({ error: "not_found" });
    }

    res.json(product);
  } catch (err) {
    console.error("PRODUCT UPDATE ERROR:", err);
    res.status(500).json({ error: "update_failed" });
  }
});

// DELETE /api/products/:id — видалити продукт
router.delete("/:id", authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await sql`
      DELETE FROM products 
      WHERE id = ${id} AND author_id = ${req.user.id}
      RETURNING id
    `;

    if (!product) {
      return res.status(404).json({ error: "not_found" });
    }

    res.json({ success: true, id: product.id });
  } catch (err) {
    console.error("PRODUCT DELETE ERROR:", err);
    res.status(500).json({ error: "delete_failed" });
  }
});

export default router;