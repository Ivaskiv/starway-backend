// auth/register.js
import { Router } from "express";
import { getUserByEmail, createEmailUser } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const exists = await getUserByEmail(email);
    if (exists) {
      return res.status(400).json({ error: "email_exists" });
    }

    const user = await createEmailUser({ name, email, password });

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    await storeRefreshToken(user.id, refresh);

    res.json({ 
      ok: true, 
      token: access,
      access,
      refresh,
      userId: user.id
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;