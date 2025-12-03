// db/client.js
import { neon } from '@neondatabase/serverless';

// новий рекомендований клієнт
export const sql = neon(process.env.DATABASE_URL);

