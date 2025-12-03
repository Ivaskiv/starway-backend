// db/client.js
import { neon } from '@neondatabase/serverless';
import dotenv from "dotenv";
dotenv.config();

// новий рекомендований клієнт
export const sql = neon(process.env.DATABASE_URL);

// старий pool → створюємо заглушку, щоб не падали старі файли
export const pool = {
  query: async (strings, ...values) => {
    return { rows: await sql(strings, ...values) };
  }
};
