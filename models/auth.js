// models/auth.js

import { sql } from "../db/client.js";

export async function storeRefreshToken(userId, token) {
  await sql`
    INSERT INTO refresh_tokens (user_id, token)
    VALUES (${userId}, ${token})
  `;
}

export async function deleteRefreshToken(userId) {
  await sql`
    DELETE FROM refresh_tokens WHERE user_id = ${userId}
  `;
}
