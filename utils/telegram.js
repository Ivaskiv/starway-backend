// utils/telegram.js

import crypto from "crypto";

export function verifyTelegramAuth({ hash, ...data }) {
  const secret = crypto.createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
}
