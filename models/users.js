//models/users.js

import { sql } from "../db/client.js";
import bcrypt from "bcryptjs";

// ===== GET BY EMAIL =====
export async function getUserByEmail(email) {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return rows[0] || null;
}

// ===== GET BY TELEGRAM =====
export async function getUserByTelegramId(id) {
  const rows = await sql`
    SELECT * FROM users WHERE telegram_id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

// ===== CREATE EMAIL USER =====
export async function createEmailUser({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, source)
    VALUES (${name}, ${email}, ${hash}, 'email')
    RETURNING *
  `;
  return rows[0];
}

// ===== VALIDATE PASSWORD =====
export async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}
