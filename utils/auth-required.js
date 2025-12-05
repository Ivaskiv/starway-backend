// utils/auth-required.js
import { verifyAccess } from "./jwt.js";

export function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization;
    
    if (!auth) {
      console.log("❌ No Authorization header");
      return res.status(401).json({ error: "no_token" });
    }

    const token = auth.replace("Bearer ", "").trim();
    
    if (!token) {
      console.log("❌ Empty token");
      return res.status(401).json({ error: "no_token" });
    }

    const decoded = verifyAccess(token);
    
    if (!decoded.userId) {
      console.log("❌ No userId in token");
      return res.status(401).json({ error: "invalid_token" });
    }

    // ✅ Зберігаємо userId в req
    req.userId = decoded.userId;
    
    console.log("✅ Auth success for userId:", decoded.userId);
    
    next();

  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    return res.status(401).json({ 
      error: "invalid_token",
      message: err.message 
    });
  }
}