//api/auth/register.js

import { Router } from "express";
import { createEmailUser, getUserByEmail } from "../models/users.js";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await getUserByEmail(email);
  if (exists) return res.status(409).json({ error: "email_exists" });

  const user = await createEmailUser({ name, email, password });
  res.json({ userId: user.id });
});

export default router;
