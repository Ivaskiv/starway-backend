// models/enrollments.js
import { sql } from "../db/client.js";

export async function getEnrollment(userId, productId) {
  const rows = await sql`
    SELECT *
    FROM enrollments
    WHERE user_id = ${userId} AND product_id = ${productId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function createEnrollment({
  user_id,
  product_id,
  pay_source,
  pay_ref,
  amount,
  currency,
  expires_at
}) {
  const rows = await sql`
    INSERT INTO enrollments (
      user_id,
      product_id,
      status,
      pay_source,
      pay_ref,
      amount,
      currency,
      expires_at
    )
    VALUES (
      ${user_id},
      ${product_id},
      'active',
      ${pay_source},
      ${pay_ref},
      ${amount},
      ${currency},
      ${expires_at}
    )
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET
      status = 'active',
      pay_source = EXCLUDED.pay_source,
      pay_ref = EXCLUDED.pay_ref,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      expires_at = EXCLUDED.expires_at
    RETURNING *
  `;

  return rows[0];
}
