// utils/jwt.js
import jwt from "jsonwebtoken";

const ACCESS_TTL = "1d";
const REFRESH_TTL = "30d";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Перевірка при старті
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('❌ JWT secrets not configured!');
}

export function signAccess(userId) {
  return jwt.sign(
    { userId, type: 'access' }, 
    JWT_SECRET, 
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefresh(userId) {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    JWT_REFRESH_SECRET,  
    { expiresIn: REFRESH_TTL }
  );
}

export function verifyAccess(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefresh(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);  
}