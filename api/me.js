// api/me.js
import { verifyJwt } from "../../utils/jwt.js";
import { sql } from "../../db/client.js";

export default async function (req, res) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Missing token" });

    const token = auth.replace("Bearer ", "");
    const { userId } = verifyJwt(token);

    const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}
