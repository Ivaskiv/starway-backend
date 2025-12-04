//models/users.js

//models/users.js

import { sql } from "../db/client.js";
import bcrypt from "bcryptjs";

export async function getUserById(id) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
}

export async function getUserByTelegramId(id) {
  const rows = await sql`SELECT * FROM users WHERE telegram_id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function createEmailUser({ name, email, password, source = 'email' }) {
  const hash = await bcrypt.hash(password, 10);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, source)
    VALUES (${name}, ${email}, ${hash}, ${source})
    RETURNING *
  `;
  return rows[0];
}

export async function createTelegramUser({ telegram_id, telegram_username, name, source = 'telegram' }) {
  const rows = await sql`
    INSERT INTO users (telegram_id, telegram_username, name, source)
    VALUES (${telegram_id}, ${telegram_username}, ${name}, ${source})
    RETURNING *
  `;
  return rows[0];
}

export async function validatePassword(user, password) {
  if (!user?.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}