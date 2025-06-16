import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { initData } = req.body;
  
  if (!initData || typeof initData !== "string") {
    return res.status(400).json({ error: "Отсутствующие или недопустимые данные initData" });
  }

  if (!process.env.TG_BOT_TOKEN) {
    return res.status(500).json({ error: "TG_BOT_TOKEN не установлен" });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  
  if (!hash) {
    return res.status(400).json({ error: "Отсутствует хэш-параметр" });
  }

  params.delete("hash");

  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));

  const dataCheckString = entries.map(([key, val]) => `${key}=${val}`).join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData")
    .update(process.env.TG_BOT_TOKEN)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return res.status(200).json({ valid: computedHash === hash });
}