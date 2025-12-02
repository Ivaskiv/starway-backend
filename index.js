// index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import usersRouter from "./api/users.js";
import lessonsRouter from "./api/lessons.js";
import progressRouter from "./api/progress.js";
import purchasesRouter from "./api/purchases.js";
import webhookRouter from "./api/webhook.js";
import meRouter from './api/me.js';
import miniappsRouter from './api/miniapps.js';
import pingRouter from './api/ping.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", usersRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/progress", progressRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/me", meRouter);
app.use("/api/miniapps", miniappsRouter);
app.use('/api/ping', pingRouter);


app.get('/', (req, res) => {
  res.send('Starway Backend API is running ✨');
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
export default app;
