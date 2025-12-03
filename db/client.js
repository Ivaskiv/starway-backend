// db/client.js
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Завантажуємо .env перед усім іншим
dotenv.config();

// Перевіряємо чи є DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables!');
  console.error('Please check your .env file');
  process.exit(1);
}

// Створюємо клієнт
export const sql = neon(process.env.DATABASE_URL);

// Debug log (тільки для dev)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Database client initialized');
}