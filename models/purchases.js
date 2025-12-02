import { sql } from "../db/client.js";

export async function createMiniappPurchase({ user_id, miniapp_id, source, external_id, amount, currency }) {
  const rows = await sql`
    INSERT INTO purchases (user_id, miniapp_id, source, external_id, amount, currency)
    VALUES (${user_id}, ${miniapp_id}, ${source}, ${external_id}, ${amount}, ${currency})
    ON CONFLICT (user_id, miniapp_id) DO UPDATE
      SET status = 'paid'
    RETURNING *
  `;
  return rows[0];
}

export async function getMiniappPurchases(userId) {
  return await sql`
    SELECT * FROM purchases WHERE user_id = ${userId}
  `;
}
