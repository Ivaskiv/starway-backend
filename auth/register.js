
// auth/register.js
import { sql } from "../db/client.js";
import bcrypt from "bcryptjs";
import { signAccess } from "../utils/jwt.js";

export default async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // чи існує вже?
    const exists = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (exists.length > 0) {
      return res.status(400).json({ error: "email_exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO users (name, email, password_hash, source)
      VALUES (${name}, ${email}, ${hash}, 'tilda')
      RETURNING *
    `;

    const user = rows[0];

    const token = signAccess({ id: user.id });

    return res.json({ ok: true, token });

  } catch (err) {
    console.error("REGISTER ERROR", err);
    return res.status(500).json({ error: "server_error" });
  }
}
