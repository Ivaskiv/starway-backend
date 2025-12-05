// api/app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";

import login from "../auth/login.js";
import register from "../auth/register.js";
import refresh from "../auth/refresh.js";
import logout from "../auth/logout.js";
import telegram from "../auth/telegram.js";

import { authRequired } from "../utils/auth-required.js";

import usersRouter from "../routes/users.js";
import lessonsRouter from "../routes/lessons.js";
import progressRouter from "../routes/progress.js";
import answersRouter from "../routes/answers.js";
import purchasesRouter from "../routes/purchases.js";
import miniappsRouter from "../routes/miniapps.js";
import meRouter from "../routes/me.js";
import cabinetRouter from "../routes/cabinet.js";
import productsRouter from "../routes/products.js";
import enrollmentsRouter from "../routes/enrollments.js";
import paymentsWayForPay from "../routes/payments/wayforpay.js";
import pingRouter from "../routes/ping.js";
import webhookRouter from "../routes/webhook.js";

const app = express();

// CORS - РОЗШИРЕНИЙ
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://star-way.pro',
      'https://www.star-way.pro',
      'https://starway-backend-qtzh.vercel.app',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Дозволяємо всі для debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Додатковий CORS для preflight
app.options('*', cors());

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/auth/login", login);
app.use("/auth/register", register);
app.use("/auth/refresh", refresh);
app.use("/auth/logout", logout);
app.use("/auth/telegram", telegram);

app.use("/api/ping", pingRouter);
app.use("/api/users", usersRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/miniapps", miniappsRouter);
app.use("/api/payments/wayforpay", paymentsWayForPay);
app.use("/api/webhook", webhookRouter);

app.use("/api/me", authRequired, meRouter);
app.use("/api/cabinet", authRequired, cabinetRouter);
app.use("/api/progress", authRequired, progressRouter);
app.use("/api/answers", authRequired, answersRouter);
app.use("/api/purchases", authRequired, purchasesRouter);
app.use("/api/products", authRequired, productsRouter);
app.use("/api/enrollments", authRequired, enrollmentsRouter);

app.get("/", (req, res) => {
  res.json({
    name: "🌟 Starway Backend",
    version: "3.0",
    status: "running"
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.path });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: "server_error" });
});

export default app;