import { sql } from "../db/client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { telegram_id, email, name } = req.body;

  if (!telegram_id && !email) {
    return res.status(400).json({ error: "no_identifiers" });
  }

  const users = await sql`
    SELECT * FROM users
    WHERE telegram_id = ${telegram_id} OR email = ${email}
    LIMIT 1
  `;

  let user = users[0];

  if (!user) {
    const newUsers = await sql`
      INSERT INTO users (telegram_id, email, name)
      VALUES (${telegram_id}, ${email}, ${name})
      RETURNING *
    `;
    user = newUsers[0];
  }

  const jwt = generateJwt(user.id);

  res.json({ token: jwt, user });
}
