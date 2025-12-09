// auth/adminAuth.js
import pg from "pg";
import jwt from "jsonwebtoken";

// Використовуємо той самий pool як в login.js
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Middleware для перевірки admin доступу
 */
export async function requireAdmin(req, res, next) {
  try {
    // 1. Отримати токен
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. Верифікувати токен
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "invalid_token" });
    }

    if (!decoded.userId) {
      return res.status(401).json({ error: "invalid_token" });
    }

    // 3. Завантажити користувача з БД
    const client = await pool.connect();
    const { rows } = await client.query(
      "SELECT id, email, name, role FROM users WHERE id=$1",
      [decoded.userId]
    );
    client.release();

    if (!rows.length) {
      return res.status(401).json({ error: "user_not_found" });
    }

    const user = rows[0];

    // 4. Перевірити роль
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: "forbidden",
        message: "Admin access required" 
      });
    }

    // 5. Додати дані в request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    console.log(`[ADMIN] ${user.email} accessed ${req.method} ${req.path}`);

    next();
  } catch (err) {
    console.error("🔥 ADMIN AUTH ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
}

/**
 * Middleware для звичайного auth (не обов'язково admin)
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "invalid_token" });
    }

    if (!decoded.userId) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const client = await pool.connect();
    const { rows } = await client.query(
      "SELECT id, email, name, role FROM users WHERE id=$1",
      [decoded.userId]
    );
    client.release();

    if (!rows.length) {
      return res.status(401).json({ error: "user_not_found" });
    }

    req.user = rows[0];
    req.userId = rows[0].id;
    req.userRole = rows[0].role || 'user';

    next();
  } catch (err) {
    console.error("🔥 AUTH ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
}

export default { requireAdmin, requireAuth };