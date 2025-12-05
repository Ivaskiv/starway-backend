// utils/jwt.js
import jwt from "jsonwebtoken";

const ACCESS_TTL = "1d";  // 24 години для тестування
const REFRESH_TTL = "30d";

const SECRET = process.env.JWT_SECRET || "starway_secret_2024_change_in_production";

console.log("🔐 JWT SECRET initialized:", SECRET.substring(0, 10) + "...");

export function signAccess(userId) {
  return jwt.sign(
    { userId, type: 'access' }, 
    SECRET, 
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefresh(userId) {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    SECRET, 
    { expiresIn: REFRESH_TTL }
  );
}

export function verifyAccess(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (err) {
    console.error("❌ JWT Verify Error:", err.message);
    throw err;
  }
}

export function verifyRefresh(token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}