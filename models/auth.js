// models/auth.js

import { sql } from "../db/client.js";

export async function storeRefreshToken(userId, token) {
  await sql`
    INSERT INTO refresh_tokens (user_id, token)
    VALUES (${userId}, ${token})
    ON CONFLICT (user_id)
    DO UPDATE SET token = EXCLUDED.token
  `;
}

export async function getRefreshToken(userId) {
  const rows = await sql`
    SELECT token FROM refresh_tokens
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return rows[0]?.token || null;
}

export async function deleteRefreshToken(userId) {
  await sql`
    DELETE FROM refresh_tokens WHERE user_id = ${userId}
  `;
}
