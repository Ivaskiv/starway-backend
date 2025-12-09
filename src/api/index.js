// src/api/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import loginRouter from "../../auth/login.js";
import registerRouter from "../../auth/register.js";
import { requireAdmin } from "../../auth/adminAuth.js";
import productsRouter from "../../routes/products.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ───────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', // React dev
  'https://star-way.pro',
  'https://www.star-way.pro'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman / серверні запити
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS blocked'));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// ─── BODY PARSERS ───────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── ROUTES AUTH ────────────────────────
app.use("/auth/login", loginRouter);
app.use("/auth/register", registerRouter);

// ─── PROTECTED ROUTES ──────────────────
app.use("/api/products", requireAdmin, productsRouter);

// ─── SIMPLE ROOT FOR TEST ─────────────
app.get('/', (req, res) => {
  res.json({ status: "Starway Backend running" });
});

// ─── GLOBAL ERROR HANDLER ─────────────
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

// ─── START SERVER ──────────────────────
if (!process.env.VERCEL) { // локальний запуск
  app.listen(PORT, () => {
    console.log(`
✅ Database client initialized
🚀 Server running locally
📍 http://localhost:${PORT}
`);
  });
}
console.log("DATABASE_URL:", process.env.DATABASE_URL);

export default app;
