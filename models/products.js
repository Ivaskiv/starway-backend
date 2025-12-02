import { sql } from "../db/client.js";

export async function getAllProducts() {
  return await sql`
    SELECT *
    FROM products
    WHERE is_active = true
    ORDER BY sort ASC, created_at DESC
  `;
}

export async function getProductBySlug(slug) {
  const rows = await sql`
    SELECT * FROM products WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getUserProducts(userId) {
  return await sql`
    SELECT
      p.*,
      -- enrollment?
      CASE
        WHEN e.status = 'active' THEN 'active'
        WHEN p.type = 'free' THEN 'active'
        ELSE 'locked'
      END AS status,

      -- progress placeholder
      COALESCE(pr.progress, 0) AS progress

    FROM products p
    LEFT JOIN enrollments e
      ON e.product_id = p.id AND e.user_id = ${userId}

    LEFT JOIN (
      SELECT product_id, ROUND(AVG(CASE WHEN completed THEN 100 ELSE 0 END)) as progress
      FROM progress
      WHERE user_id = ${userId}
      GROUP BY product_id
    ) pr
      ON pr.product_id = p.id

    WHERE p.is_active = true
    ORDER BY p.sort ASC, p.created_at DESC
  `;
}
