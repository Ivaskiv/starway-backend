export function parseStartParam(param) {
  // "paid-5funnel|source=tilda"
  try {
    const [paid, rest] = param.split("-");
    const [courseId, source] = rest.split("|source=");
    return { type: paid, courseId, source };
  } catch {
    return null;
  }
}
