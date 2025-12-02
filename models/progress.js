// models/progress.js
import { sql } from "../db/client.js";

export async function getUserProgress(userId, productId) {
  return await sql`
    SELECT *
    FROM progress
    WHERE user_id = ${userId}
      AND product_id = ${productId}
  `;
}

export async function setWatched(userId, productId, lessonId) {
  await sql`
    INSERT INTO progress (user_id, product_id, lesson_id, status, watched_video)
    VALUES (${userId}, ${productId}, ${lessonId}, 'open', true)
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET watched_video = true, status = 'open', updated_at = NOW()
  `;
}

export async function completeLesson(userId, productId, lessonId) {
  await sql`
    INSERT INTO progress (user_id, product_id, lesson_id, status, completed)
    VALUES (${userId}, ${productId}, ${lessonId}, 'completed', true)
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET completed = true, status = 'completed', updated_at = NOW()
  `;
}

export async function unlockLesson(userId, productId, lessonId) {
  await sql`
    INSERT INTO progress (user_id, product_id, lesson_id, status)
    VALUES (${userId}, ${productId}, ${lessonId}, 'open')
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET status = 'open', updated_at = NOW()
  `;
}

export async function getNextLesson(productId, lessonNumber) {
  const rows = await sql`
    SELECT id
    FROM lessons
    WHERE product_id = ${productId}
      AND lesson_number = ${lessonNumber + 1}
    LIMIT 1
  `;
  return rows[0] || null;
}
