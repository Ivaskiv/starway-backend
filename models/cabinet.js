// models/cabinet.js

import { sql } from "../db/client.js";

export async function getUser(uid) {
  const rows = await sql`
    SELECT *
    FROM users
    WHERE id = ${uid}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getProducts() {
  return await sql`
    SELECT *
    FROM products
    WHERE is_active = true
    ORDER BY sort ASC, created_at DESC
  `;
}

export async function getEnrollments(uid) {
  return await sql`
    SELECT *
    FROM enrollments
    WHERE user_id = ${uid}
  `;
}

export async function getProgress(uid) {
  return await sql`
    SELECT *
    FROM progress
    WHERE user_id = ${uid}
  `;
}

export async function getMiniapps() {
  return await sql`
    SELECT *
    FROM miniapps
    ORDER BY sort ASC, created_at ASC
  `;
}

export async function getMiniappPurchases(uid) {
  return await sql`
    SELECT miniapp_id
    FROM purchases
    WHERE user_id = ${uid}
  `;
}
