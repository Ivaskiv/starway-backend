// auth/telegram.js
import { sql } from "../db/client.js";
import { signAccess } from "../utils/jwt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { telegram_id, telegram_username, email, name } = req.body;

  if (!telegram_id && !email) {
    return res.status(400).json({ error: "no_identifiers" });
  }

  // Шукаємо user по telegram_id або email
  const users = await sql`
    SELECT * FROM users
    WHERE telegram_id = ${telegram_id} OR email = ${email}
    LIMIT 1
  `;

  let user = users[0];

  if (!user) {
    // Створюємо нового
    const newUsers = await sql`
      INSERT INTO users (telegram_id, telegram_username, email, name, source)
      VALUES (${telegram_id}, ${telegram_username}, ${email}, ${name}, 'telegram')
      RETURNING *
    `;
    user = newUsers[0];
  } else {
    // Оновлюємо існуючого: додаємо telegram_id якщо його немає
    if (telegram_id && !user.telegram_id) {
      await sql`
        UPDATE users
        SET telegram_id = ${telegram_id},
            telegram_username = ${telegram_username},
            updated_at = NOW()
        WHERE id = ${user.id}
      `;
    }
    
    // Додаємо email якщо його немає
    if (email && !user.email) {
      await sql`
        UPDATE users
        SET email = ${email},
            name = COALESCE(name, ${name}),
            updated_at = NOW()
        WHERE id = ${user.id}
      `;
    }
  }

  const token = signAccess(user.id);

  res.json({ token, user });
}