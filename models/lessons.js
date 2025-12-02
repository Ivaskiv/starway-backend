//models/lessons.js

import { sql } from "../db/client.js";

export async function getProductBySlug(slug) {
  const rows = await sql`
    SELECT * FROM products WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getLessonsByProduct(productId) {
  return await sql`
    SELECT *
    FROM lessons
    WHERE product_id = ${productId}
    ORDER BY lesson_number ASC, order_index ASC
  `;
}

export async function getLessonById(id) {
  const rows = await sql`
    SELECT *
    FROM lessons
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getUserLessonProgress(userId, productId) {
  return await sql`
    SELECT *
    FROM progress
    WHERE user_id = ${userId}
      AND product_id = ${productId}
  `;
}

export async function hasActiveEnrollment(userId, productId) {
  const rows = await sql`
    SELECT *
    FROM enrollments
    WHERE user_id = ${userId}
      AND product_id = ${productId}
      AND status = 'active'
    LIMIT 1
  `;
  return rows.length > 0;
}
