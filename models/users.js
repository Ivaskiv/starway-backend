import { sql } from "../db/client.js";
import bcrypt from "bcryptjs";

export async function getUserById(id) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function getUserByTelegramId(tgId) {
  const rows = await sql`
    SELECT * FROM users WHERE telegram_id = ${tgId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return rows[0] || null;
}

export async function createTelegramUser({ telegram_id, telegram_username, name, source }) {
  const rows = await sql`
    INSERT INTO users (telegram_id, telegram_username, name, source)
    VALUES (${telegram_id}, ${telegram_username}, ${name}, ${source})
    RETURNING *
  `;
  return rows[0];
}

export async function createEmailUser({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${hash})
    RETURNING *
  `;
  return rows[0];
}

export async function validatePassword(user, password) {
  if (!user?.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}
