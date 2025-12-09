// check-db.js
import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Підключення до PostgreSQL успішне');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Не вдалося підключитися до PostgreSQL');
    console.error(err);
    process.exit(1);
  }
}

checkDB();

