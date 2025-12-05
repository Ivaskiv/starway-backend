// auth/login.js
import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Neon Pool (Serverless friendly)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// POST /auth/login
router.post("/", async (req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error:"missing_fields" });

  try {
    const client = await pool.connect();
    const query = "SELECT id,email,password_hash,name FROM users WHERE email=$1";
    const { rows } = await client.query(query, [email]);
    client.release();

    if(!rows.length) return res.status(401).json({ error:"invalid" });

    const user = rows[0];
    const match = await bcrypt.compare(password,user.password_hash);
    if(!match) return res.status(401).json({ error:"invalid" });

    const token = jwt.sign({ userId:user.id, email:user.email }, process.env.JWT_SECRET, { expiresIn:"7d" });

    res.json({
      access: token,
      user: { id:user.id, email:user.email, name:user.name }
    });
  } catch(err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ error:"server_error" });
  }
});

export default router;
