// routes/purchases.js
import { Router } from "express";
import { sql } from "../db/client.js";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await sql`
    SELECT * FROM purchases ORDER BY created_at DESC
  `;
  res.json(rows);
});

export default router;
