import express from "express";
import { verifyJwt } from "../utils/jwt.js";
import { getUserProducts } from "../models/products.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { userId } = verifyJwt(token);

    const products = await getUserProducts(userId);

    res.json({ products });

  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or missing token" });
  }
});

export default router;
