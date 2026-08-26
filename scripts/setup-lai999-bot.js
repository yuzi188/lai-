const fs = require("fs");
const path = require("path");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv(path.join(__dirname, "..", ".env"));

const token = process.env.TELEGRAM_BOT_TOKEN;
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const botBaseUrl = token ? `https://api.telegram.org/bot${token}` : "";

function requireHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

async function telegram(method, payload) {
  const response = await fetch(`${botBaseUrl}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}

function pageUrl(pathname) {
  const url = new URL(pathname, publicBaseUrl);
  url.searchParams.set("storeId", "hainan-singapore");
  url.searchParams.set("source", "telegram");
  url.searchParams.set("bot", "Lai999_BOT");
  return url.toString();
}

async function setup() {
  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN. Put it in .env or a hosting secret, not in source files.");
    process.exit(1);
  }

  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "打開海南雞飯 AI 功能頁" },
      { command: "order", description: "開始 AI 點餐" },
      { command: "location", description: "店址導航" },
      { command: "hours", description: "營業時間" },
      { command: "support", description: "客服與回饋" }
    ]
  });

  await telegram("setMyShortDescription", {
    short_description: "海南雞飯 AI 點餐、定位、客服與訂單查詢。"
  });

  await telegram("setMyDescription", {
    description: "老王新加坡海南雞飯 AI 功能頁：支援多語點餐、忌口過敏備註、訂單同步後台與後廚、基本客服、店址導航與訂單查詢。"
  });

  const httpsBaseUrl = requireHttpsUrl(publicBaseUrl);
  if (!httpsBaseUrl) {
    console.log(JSON.stringify({
      ok: true,
      commands: "configured",
      webhook: "skipped",
      menuButton: "skipped",
      reason: "PUBLIC_BASE_URL must be a public HTTPS URL for Telegram Web Apps and webhooks."
    }, null, 2));
    return;
  }

  await telegram("setWebhook", {
    url: new URL("/api/telegram/lai999/webhook", httpsBaseUrl).toString(),
    allowed_updates: ["message", "callback_query"]
  });

  await telegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "AI 點餐",
      web_app: {
        url: pageUrl("/lai999-bot.html")
      }
    }
  });

  console.log(JSON.stringify({
    ok: true,
    commands: "configured",
    webhook: "configured",
    menuButton: "configured",
    featurePageUrl: pageUrl("/lai999-bot.html")
  }, null, 2));
}

setup().catch(error => {
  console.error(error.message);
  process.exit(1);
});
