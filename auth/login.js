// auth/login.js
import { Router } from "express";
import { getUserByEmail, validatePassword } from "../models/users.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { storeRefreshToken } from "../models/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  console.log("═══════════════════════════════════");
  console.log("📥 LOGIN REQUEST RECEIVED");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password } = req.body;

    console.log("📝 Extracted credentials:", {
      email: email,
      passwordProvided: !!password,
      passwordLength: password?.length
    });

    if (!email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "missing_fields" });
    }

    console.log("🔍 Looking up user:", email);
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "invalid" });
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password_hash
    });

    console.log("🔐 Validating password...");
    const ok = await validatePassword(user, password);
    
    if (!ok) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ error: "invalid" });
    }

    console.log("✅ Password valid!");

    // Генеруємо токени
    console.log("🎫 Generating tokens...");
    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    console.log("✅ Tokens generated:", {
      access: access.substring(0, 20) + "...",
      refresh: refresh.substring(0, 20) + "..."
    });

    console.log("💾 Storing refresh token...");
    await storeRefreshToken(user.id, refresh);
    console.log("✅ Refresh token stored");

    const response = { 
      access, 
      refresh, 
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    console.log("📤 Sending response:", {
      userId: user.id,
      userName: user.name,
      hasToken: true
    });

    console.log("✅ LOGIN SUCCESS!");
    console.log("═══════════════════════════════════");

    res.json(response);

  } catch (err) {
    console.error("═══════════════════════════════════");
    console.error("❌ LOGIN ERROR:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("═══════════════════════════════════");
    
    res.status(500).json({ 
      error: "server_error", 
      message: err.message 
    });
  }
});

export default router;