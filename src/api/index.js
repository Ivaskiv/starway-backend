// src/api/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";

// ─── AUTH ──────────────────────────
import login from "../../auth/login.js";
import register from "../../auth/register.js";
import refresh from "../../auth/refresh.js";
import logout from "../../auth/logout.js";
import telegram from "../../auth/telegram.js";

// ─── MIDDLEWARES ──────────────────
import { authRequired, adminRequired } from "../../utils/auth-required.js";

// ─── ROUTES ───────────────────────
import usersRouter from "../../routes/users.js";
import lessonsRouter from "../../routes/lessons.js";
import progressRouter from "../../routes/progress.js";
import answersRouter from "../../routes/answers.js";
import purchasesRouter from "../../routes/purchases.js";
import miniappsRouter from "../../routes/miniapps.js";
import meRouter from "../../routes/me.js";
import cabinetRouter from "../../routes/cabinet.js";
import productsRouter from "../../routes/products.js";
import enrollmentsRouter from "../../routes/enrollments.js";
import paymentsWayForPay from "../../routes/payments/wayforpay.js";
import pingRouter from "../../routes/ping.js";
import webhookRouter from "../../routes/webhook.js";

const app = express();

const allowedOrigins = [
  'https://star-way.pro',
  'http://star-way.pro',
  'https://www.star-way.pro',
  'http://www.star-way.pro',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173', // додано для локального фронта
];

// ─── CORS ─────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser tools like Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('⚠️ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept"],
  exposedHeaders: ["Content-Length","Content-Type"]
}));
app.options('*', cors());

// ─── BODY PARSERS ─────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── DEV LOGGER ───────────────────
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ─── AUTH ─────────────────────────
app.use("/auth/login", login);
app.use("/auth/register", register);
app.use("/auth/refresh", refresh);
app.use("/auth/logout", logout);
app.use("/auth/telegram", telegram);

// ─── PUBLIC ROUTES ────────────────
app.use("/api/ping", pingRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/miniapps", miniappsRouter);
app.use("/api/payments/wayforpay", paymentsWayForPay);
app.use("/api/users", usersRouter);
app.use("/api/lessons", lessonsRouter);

// ─── AUTH REQUIRED ROUTES ─────────
app.use("/api/me", authRequired, meRouter);
app.use("/api/cabinet", authRequired, cabinetRouter);
app.use("/api/progress", authRequired, progressRouter);
app.use("/api/answers", authRequired, answersRouter);
app.use("/api/purchases", authRequired, purchasesRouter);
app.use("/api/enrollments", authRequired, enrollmentsRouter);

// Тільки адмін може CRUD продукти
app.use("/api/products", authRequired, adminRequired, productsRouter);

// ─── HOME ─────────────────────────
app.get("/", (_, res) => {
  res.json({ 
    name:"🌟 Starway Backend", 
    version:"3.0", 
    status:"running", 
    timestamp:new Date().toISOString() 
  });
});

// ─── 404 ──────────────────────────
app.use((req,res) => res.status(404).json({ error:"not_found", path:req.path }));

// ─── GLOBAL ERROR HANDLER ─────────
app.use((err,_,res,__)=>{
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({ error:"server_error" });
});

// ─── EXPORT FOR VERCEL ───────────
export default app;
