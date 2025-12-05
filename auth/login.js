// auth/login.js
import { Router } from "express";
import { getUserByEmail, validatePassword } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    console.log("📥 LOGIN REQUEST:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "missing_fields" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "invalid" });
    }

    const ok = await validatePassword(user, password);
    if (!ok) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ error: "invalid" });
    }

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    await storeRefreshToken(user.id, refresh);
console.log("✅ LOGIN SUCCESS:", user.id);
res.json({ 
      access, 
      refresh, 
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;