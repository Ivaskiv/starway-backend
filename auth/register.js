// auth/register.js
import express from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../models/users.js";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "missing_fields" });

  try {
    const exists = await findUserByEmail(email);
    if (exists) return res.status(409).json({ error: "email_exists" });

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      id: crypto.randomUUID(),
      email,
      password_hash,
      name: name || "",
      role: "user",
    });

    res.json({ user: newUser });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
