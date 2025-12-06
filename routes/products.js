// routes/products.js
import express from "express";
import { getUserProducts } from "../models/products.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    const products = await getUserProducts(userId);
    res.json({ products });
  } catch (err) {
    console.error("Products error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;