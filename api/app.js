// api/app.js
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
import telegram from "./auth/telegram.js";

// UTILS
import { authRequired } from "../utils/auth-required.js";

// API ROUTERS
import usersRouter from "./users.js";
import lessonsRouter from "./lessons.js";
import progressRouter from "./progress.js";
import answersRouter from "./answers.js";
import purchasesRouter from "./purchases.js";
import miniappsRouter from "./miniapps.js";
import cabinetRouter from "./cabinet.js";
import productsRouter from "./products.js";
import enrollmentsRouter from "./enrollments.js";
import paymentsWayForPay from "./payments/wayforpay.js";
import pingRouter from "./ping.js";
import webhookRouter from "./webhook.js";
import meRouter from "./me.js"; 

const app = express();

// CORS
app.use(cors({
  origin: [
    "https://star-way.pro",
    "https://www.star-way.pro",
    "https://starway-backend-qtzh.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// BASIC MIDDLEWARE
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// AUTH ROUTES
app.use("/auth/login", login);
app.use("/auth/register", register);
app.use("/auth/refresh", refresh);
app.use("/auth/logout", logout);
app.use("/auth/telegram", telegram);

// PUBLIC API
app.use("/api/ping", pingRouter);
app.use("/api/users", usersRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/miniapps", miniappsRouter);
app.use("/api/payments/wayforpay", paymentsWayForPay);
app.use("/api/webhook", webhookRouter);

// PROTECTED API
app.use("/api/me", authRequired, meRouter);
app.use("/api/cabinet", authRequired, cabinetRouter);
app.use("/api/progress", authRequired, progressRouter);
app.use("/api/answers", authRequired, answersRouter);
app.use("/api/purchases", authRequired, purchasesRouter);
app.use("/api/products", authRequired, productsRouter);
app.use("/api/enrollments", authRequired, enrollmentsRouter);

// ROOT
app.get("/", (req, res) => {
  res.json({
    name: "🌟 Starway Backend",
    version: "3.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "route_not_found", path: req.path });
});

// 500
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

export default app;
