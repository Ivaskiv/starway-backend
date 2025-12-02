// utils/progress.js

export function getLessonStatus(lesson, progress, hasAccess) {
  const p = progress.find(r => r.lesson_id === lesson.id);
  if (p?.completed) return "completed";
  if (lesson.is_free || hasAccess) return "open";
  if (p?.status === "open") return "open";
  return "locked";
}
