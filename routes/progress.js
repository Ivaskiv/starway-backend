// routes/progress.js
import { Router } from "express";
import { authRequired } from "../utils/auth-required.js";
import { sql } from "../db/client.js";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Налаштування multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/tasks/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Недозволений тип файлу"));
    }
  },
});

// POST /api/progress/complete-block — здати завдання
router.post(
  "/complete-block",
  authRequired,
  upload.single("file"),
  async (req, res) => {
    const { block_id, answer = "" } = req.body;
    const file = req.file;

    if (!block_id) {
      return res.status(400).json({ error: "missing_block_id" });
    }

    try {
      // Отримати блок
      const [block] = await sql`
        SELECT b.*, p.id as product_id 
        FROM blocks b
        JOIN products p ON b.product_id = p.id
        WHERE b.id = ${block_id}
      `;

      if (!block) {
        return res.status(404).json({ error: "block_not_found" });
      }

      const fileUrl = file ? `/uploads/tasks/${file.filename}` : null;
      const completionId = randomUUID();

      // Зберегти/оновити completion
      await sql`
        INSERT INTO block_completions (
          id, user_id, block_id, completed, user_answer, 
          file_url, points_earned, completed_at
        ) VALUES (
          ${completionId},
          ${req.user.id},
          ${block_id},
          true,
          ${answer},
          ${fileUrl},
          ${block.points},
          NOW()
        )
        ON CONFLICT (user_id, block_id) DO UPDATE SET
          completed = true,
          user_answer = ${answer},
          file_url = COALESCE(${fileUrl}, block_completions.file_url),
          points_earned = ${block.points},
          completed_at = NOW()
      `;

      // Оновити прогрес
      const progressId = randomUUID();
      const [progress] = await sql`
        INSERT INTO user_progress (
          id, user_id, product_id, total_points, completed_blocks, last_activity_date
        ) VALUES (
          ${progressId},
          ${req.user.id},
          ${block.product_id},
          ${block.points},
          1,
          CURRENT_DATE
        )
        ON CONFLICT (user_id, product_id) DO UPDATE SET
          total_points = user_progress.total_points + ${block.points},
          completed_blocks = user_progress.completed_blocks + 1,
          last_activity_date = CURRENT_DATE,
          current_streak = CASE 
            WHEN user_progress.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
              THEN user_progress.current_streak + 1
            WHEN user_progress.last_activity_date < CURRENT_DATE - INTERVAL '1 day' 
              THEN 1
            ELSE user_progress.current_streak
          END,
          level = FLOOR((user_progress.total_points + ${block.points}) / 500) + 1
        RETURNING *
      `;

      res.json({
        success: true,
        points_earned: block.points,
        file_url: fileUrl,
        progress,
      });
    } catch (err) {
      console.error("COMPLETE BLOCK ERROR:", err);
      res.status(500).json({ error: "complete_failed" });
    }
  }
);

// GET /api/progress/:product_id — прогрес по продукту
router.get("/:product_id", authRequired, async (req, res) => {
  const { product_id } = req.params;

  try {
    const [progress] = await sql`
      SELECT 
        up.*,
        (SELECT COUNT(*) FROM blocks WHERE product_id = ${product_id}) as total_blocks
      FROM user_progress up
      WHERE up.user_id = ${req.user.id} AND up.product_id = ${product_id}
    `;

    if (!progress) {
      // Створити початковий прогрес
      const progressId = randomUUID();
      const [newProgress] = await sql`
        INSERT INTO user_progress (id, user_id, product_id)
        VALUES (${progressId}, ${req.user.id}, ${product_id})
        RETURNING *,
          (SELECT COUNT(*) FROM blocks WHERE product_id = ${product_id}) as total_blocks
      `;
      return res.json(newProgress);
    }

    res.json(progress);
  } catch (err) {
    console.error("PROGRESS FETCH ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

// GET /api/progress/achievements/my — досягнення користувача
router.get("/achievements/my", authRequired, async (req, res) => {
  try {
    const achievements = await sql`
      SELECT 
        a.*,
        ua.unlocked_at,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua 
        ON a.id = ua.achievement_id AND ua.user_id = ${req.user.id}
      ORDER BY a.created_at
    `;

    res.json(achievements);
  } catch (err) {
    console.error("ACHIEVEMENTS FETCH ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

export default router;