// api/auth/check-or-create.js
import { findUserByTelegramId, createUserTelegram } from "../../models/users.js";
import { createJwt } from "../../utils/jwt.js";

export default async function (req, res) {
  try {
    const tgId = req.query.telegram_id;
    const username = req.query.username || null;
    const name = req.query.name || null;
    const source = req.query.source || "unknown";

    if (!tgId) {
      return res.status(400).json({ error: "telegram_id is required" });
    }

    let user = await findUserByTelegramId(tgId);

    if (!user) {
      user = await createUserTelegram({
        telegram_id: tgId,
        telegram_username: username,
        name,
        source
      });
    }

    const token = createJwt({ userId: user.id });

    res.json({ user, token });
  } catch (err) {
    console.error("check-or-create error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
