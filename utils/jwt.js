// utils/jwt.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TTL = "20m";
const REFRESH_TTL = "30d";

// Використовуємо один секрет для обох токенів
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export function signAccess(userId) {
  return jwt.sign({ userId, type: 'access' }, SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefresh(userId) {
  return jwt.sign({ userId, type: 'refresh' }, SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccess(token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefresh(token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}