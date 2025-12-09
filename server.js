import dotenv from "dotenv";
dotenv.config();

import express from "express";
import loginRouter from "./src/auth/login.js";

const app = express();

// ─── MIDDLEWARES ─────────────────
app.use(express.json()); // для req.body

// ─── ROUTES ──────────────────────
app.use("/auth/login", loginRouter);
app.get("/", (req, res) => res.send("Server is running"));

// ─── START SERVER ────────────────
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Starway Backend Server               ║
║                                           ║
║   📍 Local:  http://localhost:${PORT}       ║
║   📍 Admin:  http://localhost:${PORT}/admin/login.html
║   📍 Health: http://localhost:${PORT}/api/ping
║                                           ║
║   ✅ Status: Running                      ║
║                                           ║
╚═══════════════════════════════════════════╝
    `);
  });
}

export default app;
