// routes/cabinet.js
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
    // ✅ userId вже є в req через authRequired middleware
    const userId = req.userId;
    
    console.log("📥 CABINET REQUEST for userId:", userId);

    const user = await getUser(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ error: "user_not_found" });
    }

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

    console.log("✅ CABINET SUCCESS:", {
      userId,
      products: productList.length,
      miniapps: miniappList.length
    });

    res.json({
      user: normalizeUser(user),
      products: productList,
      miniapps: miniappList
    });

  } catch (err) {
    console.error("❌ CABINET ERROR:", err);
    res.status(500).json({ 
      error: "server_error", 
      message: err.message 
    });
  }
});

export default router;