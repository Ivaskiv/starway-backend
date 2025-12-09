// models/users.js
import pg from "pg";
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// === BASE HELPERS ===

export async function findUserByEmail(email) {
  const sql = `
    SELECT id, email, password_hash, name, role, telegram_id, avatar
    FROM users WHERE email=$1
  `;
  const { rows } = await pool.query(sql, [email]);
  return rows[0] || null;
}

export async function findUserByTelegram(id) {
  const sql = `SELECT * FROM users WHERE telegram_id=$1`;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}

export async function createUser({ id, email, password_hash, name, role }) {
  const sql = `
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id, email, name, role
  `;
  const { rows } = await pool.query(sql, [
    id,
    email,
    password_hash,
    name,
    role || "user",
  ]);
  return rows[0];
}

export async function updateTelegram(userId, tgId, data) {
  const sql = `
    UPDATE users
    SET telegram_id=$2, telegram_data=$3, updated_at=NOW()
    WHERE id=$1
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [userId, tgId, data]);
  return rows[0];
}
