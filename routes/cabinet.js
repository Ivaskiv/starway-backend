// cabinet.js
import jwt from "jsonwebtoken";
import { Router } from "express";

import {
  getUser,
  getProducts,
  getEnrollments,
  getProgress,
  getMiniapps,
  getMiniappPurchases
} from "../models/cabinet.js";

import {
  normalizeUser,
  buildProductItem,
  buildMiniappItem
} from "../utils/cabinet.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "missing_token" });

    const token = auth.replace("Bearer ", "").trim();

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const userId = payload.userId || payload.user_id || payload.id;
    if (!userId) return res.status(401).json({ error: "bad_token_payload" });
    console.log("✅ Cabinet load for userId:", userId);

    // --- Load Cabinet Data ---
    const user = await getUser(userId);
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const products = await getProducts();
    const enrollments = await getEnrollments(userId);
    const progress = await getProgress(userId);
    const miniapps = await getMiniapps();

    const purchased = await getMiniappPurchases(userId);
    const purchasedIds = purchased.map(p => p.miniapp_id);

    // Products with access flag
    const productList = products.map(p => {
      const enr = enrollments.find(e => e.product_id === p.id);
      return buildProductItem(p, progress, enr);
    });

    // Miniapps list
    const miniappList = miniapps.map(m =>
      buildMiniappItem(m, purchasedIds)
    );

    res.json({
      user: normalizeUser(user),
      products: productList,
      miniapps: miniappList
    });

  } catch (err) {
    console.error("CABINET ERROR:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
