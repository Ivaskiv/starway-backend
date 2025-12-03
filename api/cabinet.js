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
    const token = req.headers.authorization?.replace("Bearer ", "");

    const user = await getUser(userId);
    if (!user) return res.status(404).json({ error: "user not found" });

    const products = await getProducts();
    const enrollments = await getEnrollments(userId);
    const progress = await getProgress(userId);
    const miniapps = await getMiniapps();

    const purchased = await getMiniappPurchases(userId);
    const purchasedIds = purchased.map(p => p.miniapp_id);

    const productList = products.map(p => {
      const enr = enrollments.find(e => e.product_id === p.id);
      return buildProductItem(p, progress, enr);
    });

    const miniappList = miniapps.map(m =>
      buildMiniappItem(m, purchasedIds)
    );

    res.json({
      user: normalizeUser(user),
      products: productList,
      miniapps: miniappList
    });
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});

export default router;
