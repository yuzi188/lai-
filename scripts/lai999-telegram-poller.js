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
const localServerUrl = (process.env.LOCAL_SERVER_URL || "http://127.0.0.1:4180").replace(/\/$/, "");
const telegramBaseUrl = token ? `https://api.telegram.org/bot${token}` : "";

let offset = Number(process.env.TELEGRAM_OFFSET || 0);
let running = true;

function log(message, meta = {}) {
  const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== undefined));
  console.log(JSON.stringify({ at: new Date().toISOString(), message, ...cleanMeta }));
}

async function telegram(method, payload = {}) {
  const response = await fetch(`${telegramBaseUrl}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}

async function getUpdates() {
  return telegram("getUpdates", {
    offset,
    timeout: 25,
    allowed_updates: ["message", "callback_query"]
  });
}

async function forwardToLocalWebhook(update) {
  const response = await fetch(`${localServerUrl}/api/telegram/lai999/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Local webhook failed");
  return data;
}

async function deliverWebhookReply(reply) {
  if (!reply || !reply.method) return;
  const { method, ...payload } = reply;
  await telegram(method, payload);
}

async function handleUpdate(update) {
  offset = Math.max(offset, Number(update.update_id || 0) + 1);
  const reply = await forwardToLocalWebhook(update);
  await deliverWebhookReply(reply);
  const message = update.message || update.callback_query?.message || {};
  log("handled_update", {
    updateId: update.update_id,
    chatId: message.chat?.id,
    method: reply.method
  });
}

async function loop() {
  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN. Set it in the environment, not in source files.");
    process.exit(1);
  }

  log("lai999_poller_started", { localServerUrl });
  while (running) {
    try {
      const updates = await getUpdates();
      for (const update of updates) await handleUpdate(update);
    } catch (error) {
      log("poller_error", { error: error.message });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

process.on("SIGINT", () => {
  running = false;
});

process.on("SIGTERM", () => {
  running = false;
});

loop();
