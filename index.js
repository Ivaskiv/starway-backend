// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";

// AUTH
import login from "./auth/login.js";
import register from "./auth/register.js";
import refresh from "./auth/refresh.js";
import logout from "./auth/logout.js";
import telegramLogin from "./auth/telegram-login.js";
import telegramAuto from "./auth/telegram.js";

// UTILS
import { authRequired } from "./utils/auth-required.js";

// API
import usersRouter from "./api/users.js";
import lessonsRouter from "./api/lessons.js";
import progressRouter from "./api/progress.js";
import answersRouter from "./api/answers.js";
import purchasesRouter from "./api/purchases.js";
import miniappsRouter from "./api/miniapps.js";
import meRouter from "./api/me.js";
import cabinetRouter from "./api/cabinet.js";
import productsRouter from "./api/products.js";
import enrollmentsRouter from "./api/enrollments.js";
import paymentsWayForPay from "./api/payments/wayforpay.js";
import pingRouter from "./api/ping.js";
import webhookRouter from "./api/webhook.js";

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'https://star-way.pro',
    'https://www.star-way.pro',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

/* =====================
      AUTH (public)
===================== */
app.post("/auth/login", login);
app.post("/auth/register", register);
app.post("/auth/refresh", refresh);
app.post("/auth/logout", logout);

app.post("/auth/telegram-login", telegramLogin);
app.post("/auth/telegram", telegramAuto);

/* =====================
     PUBLIC API
===================== */
app.use("/api/ping", pingRouter);
app.use("/api/users", usersRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/miniapps", miniappsRouter);

app.use("/api/payments/wayforpay", paymentsWayForPay);
app.use("/api/webhook", webhookRouter);

/* =====================
     SECURED API
===================== */
app.use("/api/me", authRequired, meRouter);
app.use("/api/cabinet", authRequired, cabinetRouter);
app.use("/api/progress", authRequired, progressRouter);
app.use("/api/answers", authRequired, answersRouter);
app.use("/api/purchases", authRequired, purchasesRouter);
app.use("/api/products", authRequired, productsRouter);
app.use("/api/enrollments", authRequired, enrollmentsRouter);

/* =====================
         ROOT
===================== */
app.get("/", (req, res) => {
  res.json({
    name: "🌟 Starway Backend",
    version: "3.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

/* =====================
     404 + ERROR
===================== */
app.use((req, res) => {
  res.status(404).json({ error: "route_not_found", path: req.path });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

/* =====================
     LOCAL DEV
===================== */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

/* =====================
     EXPORT FOR VERCEL
===================== */
export default app;