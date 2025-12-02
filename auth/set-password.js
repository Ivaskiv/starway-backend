import { sql } from "../../db/client.js";
import { hashPassword } from "../../utils/helpers.js";
import { signToken } from "../../utils/jwt.js";

export default async function handler(req, res) {
  const { email, password } = req.body;

  const hash = await hashPassword(password);

  const rows = await sql`
    UPDATE users SET password_hash = ${hash}
    WHERE email = ${email}
    RETURNING *
  `;

  const user = rows[0];
  const token = signToken(user.id);

  res.json({ token });
}
