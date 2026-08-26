const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");

const ROOT = __dirname;
const WEB_ROOT = path.join(ROOT, "website");
const DATA_DIR = path.join(ROOT, "data");

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

loadDotEnv(path.join(ROOT, ".env"));

const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const MEMBER_LEDGER_FILE = path.join(DATA_DIR, "member-ledger.json");
const RESTAURANT_AI_FILE = path.join(DATA_DIR, "restaurant-ai-seed.json");
const PRINT_DIR = path.join(DATA_DIR, "print-jobs");
const PORT = Number(process.env.PORT || 4180);
const DATABASE_URL = process.env.DATABASE_URL || "";
const PRINTER_HOST = process.env.PRINTER_HOST || "";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);
const POS_WEBHOOK_URL = process.env.POS_WEBHOOK_URL || "";
const POS_API_KEY = process.env.POS_API_KEY || "";
const POS_TIMEOUT_MS = Number(process.env.POS_TIMEOUT_MS || 8000);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const LAI999_BOT_USERNAME = "Lai999_BOT";

const RESTAURANT_INSTANCES = {
  "hainan-singapore": {
    id: "hainan-singapore",
    botUsername: LAI999_BOT_USERNAME,
    name: "老王新加坡海南雞飯",
    shortName: "海南雞飯",
    pagePath: "/lai999-bot.html",
    orderPath: "/hainan.html",
    aiOrderPath: "/ai-order.html",
    kitchenPath: "/ai-kitchen.html",
    managerPath: "/ai-manager.html",
    address: "柬埔寨西哈努克港 JFGX 2PH",
    mapUrl: "https://maps.app.goo.gl/67szZhU9vucUTJ689?g_st=ic",
    phone: "請填入店家電話",
    hours: ["每日 10:30-20:30", "售完會提早收單"],
    payment: ["現金", "櫃台支付", "線上支付串接預留"],
    defaultLanguage: "zh-TW",
    supportedLanguages: ["zh-TW", "km", "vi", "en", "th"]
  }
};

const HAINAN_AI_IMAGES = {
  "hainan-steamed-leg-rice": "assets/hainan-ai/steamed-chicken-rice.png",
  "hainan-roast-leg-rice": "assets/hainan-ai/roast-chicken-rice.png",
  "hainan-steamed-breast-rice": "assets/hainan-ai/steamed-chicken-rice.png",
  "hainan-roast-breast-rice": "assets/hainan-ai/roast-chicken-rice.png",
  "hainan-chicken-pho-soup": "assets/hainan-ai/chicken-pho-soup.png",
  "hainan-chicken-pho-dry": "assets/hainan-ai/chicken-pho-dry.png",
  "hainan-half-steamed-chicken": "assets/hainan-ai/half-steamed-chicken.png",
  "hainan-half-roast-chicken": "assets/hainan-ai/half-roast-chicken.png",
  "hainan-century-egg-tofu": "assets/hainan-ai/century-egg-tofu.png",
  "hainan-rice": "assets/hainan-ai/hainan-addons.png",
  "hainan-egg": "assets/hainan-ai/hainan-addons.png",
  "hainan-bean-sprouts": "assets/hainan-ai/hainan-addons.png",
  "hainan-chili-sauce": "assets/hainan-ai/hainan-addons.png",
  "hainan-iced-tea": "assets/hainan-ai/hainan-addons.png"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

const ORDER_STATUSES = new Set(["pending", "preparing", "ready", "completed", "rejected", "cancelled"]);
const DIETARY_RULES = [
  {
    code: "beef",
    label: "不吃牛",
    flag: "beef",
    keywords: ["不吃牛", "禁牛", "無牛", "牛肉", "no beef", "beef"],
    allergyKeywords: ["牛肉過敏", "牛過敏", "beef allergy"]
  },
  {
    code: "pork",
    label: "不吃豬",
    flag: "pork",
    keywords: ["不吃豬", "禁豬", "無豬", "豬肉", "no pork", "pork"],
    allergyKeywords: ["豬肉過敏", "豬過敏", "pork allergy"]
  },
  {
    code: "seafood",
    label: "不吃海鮮",
    flag: "seafood",
    keywords: ["不吃海鮮", "禁海鮮", "海鮮", "蝦", "蟹", "魚", "no seafood", "seafood", "shellfish"],
    allergyKeywords: ["海鮮過敏", "蝦過敏", "蟹過敏", "魚過敏", "seafood allergy", "shellfish allergy"]
  },
  {
    code: "spicy",
    label: "不要辣",
    flag: "spicy",
    keywords: ["不吃辣", "不要辣", "無辣", "no spicy", "not spicy"],
    allergyKeywords: []
  },
  {
    code: "vegetarian",
    label: "素食",
    preference: true,
    keywords: ["素食", "吃素", "vegetarian", "vegan"],
    allergyKeywords: []
  }
];

const ALLERGEN_RULES = [
  { code: "egg", label: "蛋", keywords: ["蛋過敏", "不吃蛋", "egg allergy", "no egg"] },
  { code: "dairy", label: "奶類", keywords: ["奶過敏", "乳製品過敏", "牛奶過敏", "不吃奶", "dairy allergy", "milk allergy", "no dairy"] },
  { code: "peanut", label: "花生", keywords: ["花生過敏", "不吃花生", "peanut allergy", "no peanut"] },
  { code: "sesame", label: "芝麻", keywords: ["芝麻過敏", "不吃芝麻", "sesame allergy", "no sesame"] },
  { code: "soy", label: "大豆", keywords: ["大豆過敏", "黃豆過敏", "豆類過敏", "soy allergy", "no soy"] },
  { code: "gluten", label: "麩質", keywords: ["麩質過敏", "小麥過敏", "gluten free", "gluten allergy", "no gluten"] }
];
let pool = null;
let databaseReady = false;

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
  if (!fs.existsSync(MEMBER_LEDGER_FILE)) fs.writeFileSync(MEMBER_LEDGER_FILE, "[]", "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function createOrderId(payload = {}) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const isHainan = payload.source === "hainan-official"
    || payload.storeId === "hainan-singapore"
    || String(payload.companyName || "").includes("海南雞")
    || (payload.items || []).some(item => item.series === "hainan" || String(item.seriesName || "").includes("海南雞"));
  return `${isHainan ? "HAINAN" : "LAI"}-${stamp}-${String(now.getTime()).slice(-5)}`;
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function parseJsonBody(req) {
  return JSON.parse(await readBody(req) || "{}");
}

function validateOrder(payload) {
  const required = ["customerName", "customerPhone", "pickupType", "pickupTime", "items"];
  for (const field of required) {
    if (!payload[field] || (Array.isArray(payload[field]) && payload[field].length === 0)) return `${field} is required`;
  }
  for (const item of payload.items) {
    if (!item.name || !Number(item.quantity) || Number(item.quantity) < 1) return "Every item needs name and quantity";
  }
  return "";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function addTimeline(order, status, note = "") {
  order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
  order.timeline.push({ status, note, at: nowIso() });
}

function applyStatus(order, status, extra = {}) {
  if (!ORDER_STATUSES.has(status)) throw new Error("Unsupported order status");

  order.status = status;
  if (status === "preparing") {
    order.acceptedAt = order.acceptedAt || nowIso();
    order.preparingAt = nowIso();
    const prepMinutes = Number(extra.prepMinutes || order.prepMinutes || 20);
    order.prepMinutes = prepMinutes;
    order.estimatedReadyAt = new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();
  }
  if (status === "ready") order.readyAt = nowIso();
  if (status === "completed") order.completedAt = nowIso();
  if (status === "rejected") order.rejectedAt = nowIso();
  if (status === "cancelled") order.cancelledAt = nowIso();
  addTimeline(order, status, extra.note || "");
  return order;
}

function validateOrderItems(items = []) {
  if (!Array.isArray(items) || !items.length) return "items must be a non-empty array";
  for (const item of items) {
    if (!item.name || !Number(item.quantity) || Number(item.quantity) < 1) return "Every item needs name and quantity";
  }
  return "";
}

function updateOrderDetails(order, payload = {}) {
  const status = order.status === "accepted" ? "preparing" : order.status;
  if (!["pending", "preparing"].includes(status)) throw new Error("Only pending or preparing orders can be changed");

  const allowedFields = [
    "customerName",
    "customerPhone",
    "pickupType",
    "pickupTime",
    "tableCode",
    "language",
    "orderNote",
    "dietaryNote",
    "paymentStatus"
  ];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) order[field] = payload[field];
  }
  if (Object.prototype.hasOwnProperty.call(payload, "items")) {
    const error = validateOrderItems(payload.items);
    if (error) throw new Error(error);
    order.items = payload.items;
  }

  order.total = (order.items || []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.price || 0), 0);
  order.changeCount = Number(order.changeCount || 0) + 1;
  order.updatedAt = nowIso();
  order.lastChangeNote = payload.changeNote || payload.note || "訂單內容更新";
  addTimeline(order, "updated", order.lastChangeNote);
  return order;
}

function buildPosPayload(order, event) {
  return {
    event,
    source: "lai-bento-web",
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      company: order.companyName || ""
    },
    pickup: {
      type: order.pickupType,
      time: order.pickupTime
    },
    items: (order.items || []).map(item => ({
      series: item.seriesName || item.series || "",
      name: item.name,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      subtotal: Number(item.quantity || 0) * Number(item.price || 0)
    })),
    total: Number(order.total || 0),
    note: order.orderNote || ""
  };
}

async function syncOrderToPos(order, event) {
  if (!POS_WEBHOOK_URL) return order;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POS_TIMEOUT_MS);
  try {
    const headers = { "Content-Type": "application/json" };
    if (POS_API_KEY) headers.Authorization = `Bearer ${POS_API_KEY}`;
    const response = await fetch(POS_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(buildPosPayload(order, event)),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`POS HTTP ${response.status}: ${text.slice(0, 160)}`);

    order.posSyncStatus = "synced";
    order.posSyncedAt = nowIso();
    order.posLastEvent = event;
    order.posResponse = text.slice(0, 500);
    addTimeline(order, "pos-sync", `${event} synced`);
  } catch (error) {
    order.posSyncStatus = "failed";
    order.posLastTriedAt = nowIso();
    order.posLastEvent = event;
    order.posSyncError = error.message;
    addTimeline(order, "pos-error", `${event}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
  return order;
}

function readLocalOrders() {
  ensureDataFiles();
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders) {
  ensureDataFiles();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

function readLocalMemberLedger() {
  ensureDataFiles();
  try {
    return JSON.parse(fs.readFileSync(MEMBER_LEDGER_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeLocalMemberLedger(entries) {
  ensureDataFiles();
  fs.writeFileSync(MEMBER_LEDGER_FILE, JSON.stringify(entries, null, 2), "utf8");
}

function defaultRestaurantAiData() {
  return {
    version: 1,
    updatedAt: nowIso(),
    menu: [
      {
        id: "hainan-steamed-leg-rice",
        sku: "HAINAN_STEAMED_LEG_RICE",
        name: { "zh-TW": "白雞腿飯", en: "Steamed Chicken Leg Rice", km: "បាយមាន់ស្ងោរ ភ្លៅ", vi: "Cơm gà luộc đùi", th: "ข้าวมันไก่ต้ม น่อง" },
        description: { "zh-TW": "白切雞腿、雞油飯、小黃瓜與三色醬，適合第一次來的客人。", en: "Steamed chicken leg with chicken rice, cucumber, and three sauces.", km: "មាន់ស្ងោរ ភ្លៅ ជាមួយបាយមាន់ ត្រសក់ និងទឹកជ្រលក់។", vi: "Đùi gà luộc với cơm gà, dưa leo và ba loại sốt.", th: "ไก่ต้มส่วนน่อง เสิร์ฟกับข้าวมัน แตงกวา และน้ำจิ้มสามแบบ" },
        category: "招牌雞飯",
        price: 5.5,
        cost: 2.15,
        inventorySku: "STEAMED_CHICKEN_LEG",
        tags: ["signature", "chicken", "classic", "high-protein"],
        allergens: ["soy", "sesame"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-roast-leg-rice",
        sku: "HAINAN_ROAST_LEG_RICE",
        name: { "zh-TW": "燒雞腿飯", en: "Roast Chicken Leg Rice", km: "បាយមាន់អាំង ភ្លៅ", vi: "Cơm gà quay đùi", th: "ข้าวมันไก่ย่าง น่อง" },
        description: { "zh-TW": "燒雞腿皮香油亮，搭配雞油飯與特製醬汁。", en: "Roast chicken leg with chicken rice and house sauces.", km: "មាន់អាំង ភ្លៅ ជាមួយបាយមាន់ និងទឹកជ្រលក់ពិសេស។", vi: "Đùi gà quay với cơm gà và sốt đặc biệt.", th: "ไก่ย่างส่วนน่อง หนังหอม เสิร์ฟกับข้าวมันและน้ำจิ้ม" },
        category: "招牌雞飯",
        price: 5.5,
        cost: 2.25,
        inventorySku: "ROAST_CHICKEN_LEG",
        tags: ["signature", "chicken", "roast", "savory"],
        allergens: ["soy", "sesame", "gluten"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-steamed-breast-rice",
        sku: "HAINAN_STEAMED_BREAST_RICE",
        name: { "zh-TW": "白雞胸飯", en: "Steamed Chicken Breast Rice", km: "បាយមាន់ស្ងោរ ទ្រូង", vi: "Cơm gà luộc ức", th: "ข้าวมันไก่ต้ม อก" },
        description: { "zh-TW": "白雞胸清爽少油，適合想吃輕一點的客人。", en: "Lean steamed chicken breast with chicken rice.", km: "ទ្រូងមាន់ស្ងោរ ស្រាលខ្លាញ់ ត្រជាក់ស្រួលញ៉ាំ។", vi: "Ức gà luộc thanh nhẹ, ít dầu hơn.", th: "อกไก่ต้ม รสเบา ไขมันน้อยกว่า" },
        category: "招牌雞飯",
        price: 4.5,
        cost: 1.8,
        inventorySku: "STEAMED_CHICKEN_BREAST",
        tags: ["chicken", "lighter", "high-protein"],
        allergens: ["soy", "sesame"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-roast-breast-rice",
        sku: "HAINAN_ROAST_BREAST_RICE",
        name: { "zh-TW": "燒雞胸飯", en: "Roast Chicken Breast Rice", km: "បាយមាន់អាំង ទ្រូង", vi: "Cơm gà quay ức", th: "ข้าวมันไก่ย่าง อก" },
        description: { "zh-TW": "燒雞胸香氣重、份量剛好，適合午餐快速點。", en: "Roast chicken breast with chicken rice, good for a quick lunch.", km: "ទ្រូងមាន់អាំង ជាមួយបាយមាន់ សមស្របសម្រាប់អាហារថ្ងៃត្រង់។", vi: "Ức gà quay với cơm gà, phù hợp bữa trưa nhanh.", th: "อกไก่ย่างกับข้าวมัน เหมาะกับมื้อกลางวันเร็วๆ" },
        category: "招牌雞飯",
        price: 4.5,
        cost: 1.9,
        inventorySku: "ROAST_CHICKEN_BREAST",
        tags: ["chicken", "roast", "savory"],
        allergens: ["soy", "sesame", "gluten"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-chicken-pho-soup",
        sku: "HAINAN_CHICKEN_PHO_SOUP",
        name: { "zh-TW": "雞河粉（湯）", en: "Chicken Pho Soup", km: "គុយទាវមាន់ ទឹក", vi: "Phở gà nước", th: "ก๋วยเตี๋ยวไก่น้ำ" },
        description: { "zh-TW": "雞湯河粉搭配雞肉片，適合想吃湯麵的客人。", en: "Rice noodles in chicken broth with sliced chicken.", km: "គុយទាវក្នុងទឹកស៊ុបមាន់ ជាមួយសាច់មាន់។", vi: "Bánh phở nước dùng gà với thịt gà.", th: "เส้นก๋วยเตี๋ยวในน้ำซุปไก่พร้อมเนื้อไก่" },
        category: "河粉",
        price: 5,
        cost: 1.95,
        inventorySku: "CHICKEN_PHO",
        tags: ["chicken", "soup", "comfort"],
        allergens: ["soy"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-chicken-pho-dry",
        sku: "HAINAN_CHICKEN_PHO_DRY",
        name: { "zh-TW": "雞河粉（乾）", en: "Dry Chicken Pho", km: "គុយទាវមាន់ គោក", vi: "Phở gà khô", th: "ก๋วยเตี๋ยวไก่แห้ง" },
        description: { "zh-TW": "乾拌河粉、雞肉片與醬汁，出餐快、適合外帶。", en: "Dry rice noodles with sliced chicken and sauce.", km: "គុយទាវគោកជាមួយសាច់មាន់ និងទឹកជ្រលក់។", vi: "Phở khô với thịt gà và sốt.", th: "เส้นก๋วยเตี๋ยวแห้งกับเนื้อไก่และซอส" },
        category: "河粉",
        price: 5,
        cost: 1.85,
        inventorySku: "CHICKEN_PHO",
        tags: ["chicken", "dry-noodle", "takeout"],
        allergens: ["soy", "gluten"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-half-steamed-chicken",
        sku: "HAINAN_HALF_STEAMED_CHICKEN",
        name: { "zh-TW": "白雞半隻", en: "Half Steamed Chicken", km: "មាន់ស្ងោរ កន្លះក្បាល", vi: "Nửa con gà luộc", th: "ไก่ต้มครึ่งตัว" },
        description: { "zh-TW": "半隻白切雞，適合 2 到 3 人分享。", en: "Half steamed chicken for sharing.", km: "មាន់ស្ងោរ កន្លះក្បាល សម្រាប់ចែកគ្នាញ៉ាំ។", vi: "Nửa con gà luộc, phù hợp chia sẻ.", th: "ไก่ต้มครึ่งตัว เหมาะสำหรับแบ่งกันทาน" },
        category: "單點雞肉",
        price: 17.5,
        cost: 7.2,
        inventorySku: "HALF_STEAMED_CHICKEN",
        tags: ["sharing", "chicken", "signature"],
        allergens: ["soy", "sesame"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-half-roast-chicken",
        sku: "HAINAN_HALF_ROAST_CHICKEN",
        name: { "zh-TW": "燒雞半隻", en: "Half Roast Chicken", km: "មាន់អាំង កន្លះក្បាល", vi: "Nửa con gà quay", th: "ไก่ย่างครึ่งตัว" },
        description: { "zh-TW": "半隻燒雞，皮香肉嫩，適合多人加點。", en: "Half roast chicken with crisp skin and tender meat.", km: "មាន់អាំង កន្លះក្បាល សាច់ទន់ក្លិនឈ្ងុយ។", vi: "Nửa con gà quay, da thơm thịt mềm.", th: "ไก่ย่างครึ่งตัว หนังหอม เนื้อนุ่ม" },
        category: "單點雞肉",
        price: 17.5,
        cost: 7.6,
        inventorySku: "HALF_ROAST_CHICKEN",
        tags: ["sharing", "chicken", "roast"],
        allergens: ["soy", "sesame", "gluten"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: false, spicy: false }
      },
      {
        id: "hainan-century-egg-tofu",
        sku: "HAINAN_CENTURY_EGG_TOFU",
        name: { "zh-TW": "皮蛋豆腐", en: "Century Egg Tofu", km: "តៅហ៊ូពងខ្មៅ", vi: "Đậu hũ trứng bắc thảo", th: "เต้าหู้ไข่เยี่ยวม้า" },
        description: { "zh-TW": "冰涼小菜，適合搭配雞飯與河粉。", en: "Chilled tofu side dish with century egg.", km: "ម្ហូបចំហៀងតៅហ៊ូត្រជាក់ ជាមួយពងខ្មៅ។", vi: "Món đậu hũ lạnh với trứng bắc thảo.", th: "เต้าหู้เย็นกับไข่เยี่ยวม้า" },
        category: "小菜",
        price: 5,
        cost: 1.55,
        inventorySku: "CENTURY_EGG_TOFU",
        tags: ["side", "cold", "vegetarian"],
        allergens: ["soy"],
        dietaryFlags: { beef: false, pork: false, seafood: false, vegetarian: true, spicy: false }
      }
    ],
    addOns: [
      {
        id: "hainan-rice",
        sku: "ADDON_HAINAN_RICE",
        name: { "zh-TW": "加點油飯", en: "Extra Chicken Rice", km: "បាយមាន់បន្ថែម", vi: "Thêm cơm gà", th: "เพิ่มข้าวมัน" },
        price: 1,
        cost: 0.32,
        inventorySku: "HAINAN_RICE",
        pairTags: ["chicken", "soup", "sharing", "classic"],
        allergens: []
      },
      {
        id: "hainan-egg",
        sku: "ADDON_BRAISED_EGG",
        name: { "zh-TW": "滷蛋", en: "Braised Egg", km: "ពងទាពុះ", vi: "Trứng kho", th: "ไข่พะโล้" },
        price: 1,
        cost: 0.32,
        inventorySku: "BRAISED_EGG",
        pairTags: ["classic", "chicken", "takeout"],
        allergens: ["egg", "soy"]
      },
      {
        id: "hainan-bean-sprouts",
        sku: "ADDON_BEAN_SPROUTS",
        name: { "zh-TW": "芽菜", en: "Bean Sprouts", km: "សណ្តែកបណ្តុះ", vi: "Giá trụng", th: "ถั่วงอกลวก" },
        price: 4,
        cost: 1.1,
        inventorySku: "BEAN_SPROUTS",
        pairTags: ["chicken", "lighter", "vegetarian"],
        allergens: []
      },
      {
        id: "hainan-chili-sauce",
        sku: "ADDON_CHILI_SAUCE",
        name: { "zh-TW": "加辣椒醬", en: "Extra Chili Sauce", km: "ទឹកម្ទេសបន្ថែម", vi: "Thêm sốt ớt", th: "เพิ่มน้ำจิ้มพริก" },
        price: 0,
        cost: 0.08,
        inventorySku: "CHILI_SAUCE",
        pairTags: ["chicken", "roast", "dry-noodle"],
        allergens: [],
        dietaryFlags: { spicy: true }
      },
      {
        id: "hainan-iced-tea",
        sku: "ADDON_ICED_TEA",
        name: { "zh-TW": "冰茶", en: "Iced Tea", km: "តែទឹកកក", vi: "Trà đá", th: "ชาเย็น" },
        price: 1.5,
        cost: 0.38,
        inventorySku: "ICED_TEA",
        pairTags: ["savory", "roast", "takeout", "classic"],
        allergens: []
      }
    ],
    inventory: {
      STEAMED_CHICKEN_LEG: { name: "白雞腿", unit: "份", onHand: 36, lowStockAt: 10, reorderTo: 60, costPerUnit: 1.18, leadTimeDays: 1 },
      ROAST_CHICKEN_LEG: { name: "燒雞腿", unit: "份", onHand: 30, lowStockAt: 10, reorderTo: 55, costPerUnit: 1.28, leadTimeDays: 1 },
      STEAMED_CHICKEN_BREAST: { name: "白雞胸", unit: "份", onHand: 28, lowStockAt: 8, reorderTo: 48, costPerUnit: 0.95, leadTimeDays: 1 },
      ROAST_CHICKEN_BREAST: { name: "燒雞胸", unit: "份", onHand: 24, lowStockAt: 8, reorderTo: 45, costPerUnit: 1.05, leadTimeDays: 1 },
      CHICKEN_PHO: { name: "雞河粉備料", unit: "份", onHand: 32, lowStockAt: 10, reorderTo: 55, costPerUnit: 1.1, leadTimeDays: 1 },
      HALF_STEAMED_CHICKEN: { name: "白雞半隻", unit: "份", onHand: 10, lowStockAt: 4, reorderTo: 18, costPerUnit: 6.2, leadTimeDays: 1 },
      HALF_ROAST_CHICKEN: { name: "燒雞半隻", unit: "份", onHand: 8, lowStockAt: 4, reorderTo: 16, costPerUnit: 6.6, leadTimeDays: 1 },
      CENTURY_EGG_TOFU: { name: "皮蛋豆腐", unit: "份", onHand: 18, lowStockAt: 6, reorderTo: 32, costPerUnit: 1.25, leadTimeDays: 1 },
      HAINAN_RICE: { name: "雞油飯", unit: "碗", onHand: 80, lowStockAt: 25, reorderTo: 130, costPerUnit: 0.32, leadTimeDays: 1 },
      BRAISED_EGG: { name: "滷蛋", unit: "顆", onHand: 55, lowStockAt: 18, reorderTo: 100, costPerUnit: 0.32, leadTimeDays: 1 },
      BEAN_SPROUTS: { name: "芽菜", unit: "份", onHand: 20, lowStockAt: 8, reorderTo: 40, costPerUnit: 1.1, leadTimeDays: 1 },
      CHILI_SAUCE: { name: "辣椒醬", unit: "份", onHand: 90, lowStockAt: 30, reorderTo: 160, costPerUnit: 0.08, leadTimeDays: 1 },
      ICED_TEA: { name: "冰茶", unit: "杯", onHand: 44, lowStockAt: 15, reorderTo: 80, costPerUnit: 0.38, leadTimeDays: 1 }
    },
    feedback: [
      { id: "fb-hainan-001", date: "2026-08-25", type: "review", rating: 5, channel: "google", itemId: "hainan-steamed-leg-rice", text: "白雞腿飯很嫩，雞油飯香，辣椒醬好吃。" },
      { id: "fb-hainan-002", date: "2026-08-25", type: "complaint", rating: 2, channel: "phone", itemId: "hainan-roast-leg-rice", text: "中午尖峰等太久，燒雞飯到桌上時有點冷。" },
      { id: "fb-hainan-003", date: "2026-08-26", type: "review", rating: 4, channel: "line", itemId: "hainan-chicken-pho-soup", text: "雞河粉湯頭清爽，份量剛好。" }
    ],
    movements: []
  };
}

function normalizeRestaurantAiData(data) {
  const fallback = defaultRestaurantAiData();
  const source = data && typeof data === "object" ? data : {};
  const withImages = item => ({ ...item, image: item.image || HAINAN_AI_IMAGES[item.id] || "" });
  return {
    ...fallback,
    ...source,
    heroImage: source.heroImage || "assets/hainan-ai/hero-hainan-ai.png",
    menu: (Array.isArray(source.menu) ? source.menu : fallback.menu).map(withImages),
    addOns: (Array.isArray(source.addOns) ? source.addOns : fallback.addOns).map(withImages),
    inventory: source.inventory && typeof source.inventory === "object" ? source.inventory : fallback.inventory,
    feedback: Array.isArray(source.feedback) ? source.feedback : fallback.feedback,
    movements: Array.isArray(source.movements) ? source.movements : []
  };
}

function readRestaurantAiData() {
  ensureDataFiles();
  if (!fs.existsSync(RESTAURANT_AI_FILE)) {
    const data = defaultRestaurantAiData();
    fs.writeFileSync(RESTAURANT_AI_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
  try {
    return normalizeRestaurantAiData(JSON.parse(fs.readFileSync(RESTAURANT_AI_FILE, "utf8")));
  } catch {
    const data = defaultRestaurantAiData();
    fs.writeFileSync(RESTAURANT_AI_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
}

function writeRestaurantAiData(data) {
  ensureDataFiles();
  const normalized = normalizeRestaurantAiData(data);
  normalized.updatedAt = nowIso();
  fs.writeFileSync(RESTAURANT_AI_FILE, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function normalizeLang(lang) {
  const value = String(lang || "zh-TW").toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("km") || value.includes("khmer") || value.includes("高棉")) return "km";
  if (value.startsWith("vi") || value.includes("vietnam")) return "vi";
  if (value.startsWith("th") || value.includes("thai") || value.includes("泰")) return "th";
  return "zh-TW";
}

function localizeText(value, lang) {
  if (!value || typeof value !== "object") return String(value || "");
  return value[lang] || value["zh-TW"] || value.en || Object.values(value)[0] || "";
}

function normalizeWords(value) {
  return String(value || "").trim().toLowerCase();
}

function hasAny(text, keywords) {
  return keywords.some(keyword => text.includes(normalizeWords(keyword)));
}

function pushUnique(list, item) {
  if (!list.some(existing => existing.code === item.code)) list.push(item);
}

function normalizeCodeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === "string") return normalizeWords(item);
    return normalizeWords(item.code || item.id || item.label);
  }).filter(Boolean);
}

function buildDietaryNote(payload = {}) {
  const rawNote = String(payload.note || payload.text || payload.orderNote || "");
  const text = normalizeWords(rawNote);
  const explicitAvoid = normalizeCodeList(payload.avoid || payload.restrictions || payload.dietary);
  const explicitAllergies = normalizeCodeList(payload.allergies || payload.allergen);
  const avoid = [];
  const allergies = [];

  for (const rule of DIETARY_RULES) {
    if (explicitAvoid.includes(rule.code) || explicitAvoid.includes(normalizeWords(rule.label)) || hasAny(text, rule.keywords)) {
      pushUnique(avoid, { code: rule.code, label: rule.label, severity: rule.preference ? "preference" : "avoid", source: explicitAvoid.includes(rule.code) ? "structured" : "note" });
    }
    if (hasAny(text, rule.allergyKeywords)) {
      pushUnique(allergies, { code: rule.code, label: rule.label.replace("不吃", ""), severity: "allergy", source: "note" });
    }
  }

  for (const rule of ALLERGEN_RULES) {
    if (explicitAllergies.includes(rule.code) || explicitAllergies.includes(normalizeWords(rule.label)) || hasAny(text, rule.keywords)) {
      pushUnique(allergies, { code: rule.code, label: rule.label, severity: "allergy", source: explicitAllergies.includes(rule.code) ? "structured" : "note" });
    }
  }

  for (const code of explicitAvoid) {
    if (!avoid.some(item => item.code === code)) pushUnique(avoid, { code, label: code, severity: "avoid", source: "structured" });
  }
  for (const code of explicitAllergies) {
    if (!allergies.some(item => item.code === code)) pushUnique(allergies, { code, label: code, severity: "allergy", source: "structured" });
  }

  const flags = {
    noBeef: avoid.some(item => item.code === "beef"),
    noPork: avoid.some(item => item.code === "pork"),
    noSeafood: avoid.some(item => item.code === "seafood"),
    noSpicy: avoid.some(item => item.code === "spicy"),
    vegetarian: avoid.some(item => item.code === "vegetarian"),
    hasAllergy: allergies.length > 0
  };
  const notes = [];
  if (avoid.length) notes.push(`忌口：${avoid.map(item => item.label).join("、")}`);
  if (allergies.length) notes.push(`過敏：${allergies.map(item => item.label).join("、")}`);
  if (rawNote) notes.push(`原始備註：${rawNote}`);
  if (avoid.length || allergies.length) notes.push("數量處理：忌口/過敏為原餐點內替換或標記，不另外加餐。");

  return {
    rawNote,
    avoid,
    allergies,
    flags,
    kitchenNote: notes.join("；") || "無特殊忌口或過敏備註",
    aiProvider: "rule-stub"
  };
}

function catalogEntries(data) {
  return [
    ...(data.menu || []).map(item => ({ ...item, kind: "menu" })),
    ...(data.addOns || []).map(item => ({ ...item, kind: "addOn" }))
  ];
}

function itemMatchesCatalog(item, line) {
  const candidates = [line.id, line.sku, line.itemId, line.name].map(normalizeWords).filter(Boolean);
  const names = [
    item.id,
    item.sku,
    localizeText(item.name, "zh-TW"),
    localizeText(item.name, "en"),
    localizeText(item.name, "ja")
  ].map(normalizeWords);
  return candidates.some(candidate => names.includes(candidate));
}

function findCatalogItem(data, line) {
  return catalogEntries(data).find(item => itemMatchesCatalog(item, line)) || null;
}

function itemConflicts(item, structuredNote) {
  const conflicts = [];
  const flags = item.dietaryFlags || {};
  for (const avoid of structuredNote.avoid || []) {
    if (avoid.code === "vegetarian" && flags.vegetarian === false) conflicts.push("vegetarian");
    else if (avoid.code === "spicy" && flags.spicy) conflicts.push("spicy");
    else if (["beef", "pork", "seafood"].includes(avoid.code) && flags[avoid.code]) conflicts.push(avoid.code);
  }
  const allergens = Array.isArray(item.allergens) ? item.allergens : [];
  for (const allergy of structuredNote.allergies || []) {
    if (allergens.includes(allergy.code)) conflicts.push(`allergy:${allergy.code}`);
  }
  return [...new Set(conflicts)];
}

function publicCatalogItem(item, lang, data) {
  const inventory = data.inventory[item.inventorySku] || {};
  return {
    id: item.id,
    sku: item.sku,
    kind: item.kind || "menu",
    name: localizeText(item.name, lang),
    description: localizeText(item.description, lang),
    category: item.category || "",
    image: item.image || "",
    price: Number(item.price || 0),
    tags: item.tags || item.pairTags || [],
    allergens: item.allergens || [],
    dietaryFlags: item.dietaryFlags || {},
    inventory: {
      sku: item.inventorySku || "",
      available: Number(inventory.onHand || 0) > 0,
      lowStock: Number(inventory.onHand || 0) <= Number(inventory.lowStockAt || 0)
    }
  };
}

function recommendMenu(data, payload = {}) {
  const lang = normalizeLang(payload.language || payload.lang);
  const structuredNote = buildDietaryNote(payload);
  const budget = Number(payload.budget || payload.maxPrice || 0);
  const wantedTags = normalizeCodeList(payload.tags || payload.preferences || payload.favorites);
  const items = (data.menu || []).map(item => {
    const inventory = data.inventory[item.inventorySku] || {};
    const conflicts = itemConflicts(item, structuredNote);
    let score = 50;
    const reasons = [];
    if (conflicts.length) score -= 100;
    if (Number(inventory.onHand || 0) <= 0) score -= 100;
    if (budget && Number(item.price || 0) <= budget) {
      score += 8;
      reasons.push("符合預算");
    }
    if ((item.tags || []).includes("signature")) {
      score += 10;
      reasons.push("招牌品項");
    }
    for (const tag of wantedTags) {
      if ((item.tags || []).map(normalizeWords).includes(tag)) {
        score += 8;
        reasons.push(`符合偏好：${tag}`);
      }
    }
    if (Number(inventory.onHand || 0) <= Number(inventory.lowStockAt || 0)) reasons.push("庫存偏低，建議確認後再推");
    if (!reasons.length) reasons.push("與目前忌口條件相容");
    return {
      ...publicCatalogItem({ ...item, kind: "menu" }, lang, data),
      score,
      conflicts,
      reasons
    };
  });

  return {
    language: lang,
    dietaryNote: structuredNote,
    recommendations: items
      .filter(item => item.score > 0 && item.conflicts.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(payload.limit || 3)),
    blockedItems: items.filter(item => item.conflicts.length > 0).map(item => ({ id: item.id, name: item.name, conflicts: item.conflicts })),
    aiProvider: "rule-stub"
  };
}

function recommendUpsells(data, payload = {}) {
  const lang = normalizeLang(payload.language || payload.lang);
  const structuredNote = buildDietaryNote(payload);
  const orderedItems = Array.isArray(payload.items) ? payload.items : [];
  const matchedMenu = orderedItems.map(line => findCatalogItem(data, line)).filter(Boolean);
  const tags = new Set(matchedMenu.flatMap(item => item.tags || []));
  const addOns = (data.addOns || []).map(addOn => {
    const inventory = data.inventory[addOn.inventorySku] || {};
    const conflicts = itemConflicts(addOn, structuredNote);
    const pairMatches = (addOn.pairTags || []).filter(tag => tags.has(tag));
    let score = 35 + pairMatches.length * 10;
    if (conflicts.length) score -= 100;
    if (Number(inventory.onHand || 0) <= 0) score -= 100;
    return {
      ...publicCatalogItem({ ...addOn, kind: "addOn" }, lang, data),
      score,
      reasons: pairMatches.length ? [`搭配 ${pairMatches.join("、")} 類餐點`] : ["通用加購品"],
      conflicts
    };
  });
  return {
    upsells: addOns
      .filter(item => item.score > 0 && item.conflicts.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(payload.limit || 3)),
    aiProvider: "rule-stub"
  };
}

function calculateCosting(data, items = []) {
  const lines = [];
  const missingItems = [];
  for (const line of items) {
    const catalogItem = findCatalogItem(data, line);
    const quantity = Math.max(1, Number(line.quantity || line.qty || 1));
    if (!catalogItem) {
      missingItems.push({ name: line.name || line.id || line.sku || "", quantity });
      continue;
    }
    const unitPrice = Number(line.price ?? catalogItem.price ?? 0);
    const unitCost = Number(line.cost ?? catalogItem.cost ?? 0);
    const revenue = quantity * unitPrice;
    const cost = quantity * unitCost;
    lines.push({
      id: catalogItem.id,
      sku: catalogItem.sku,
      name: localizeText(catalogItem.name, "zh-TW"),
      quantity,
      unitPrice,
      unitCost,
      revenue,
      cost,
      grossProfit: revenue - cost,
      marginRate: revenue > 0 ? Number(((revenue - cost) / revenue).toFixed(4)) : 0
    });
  }
  const revenue = lines.reduce((sum, line) => sum + line.revenue, 0);
  const cost = lines.reduce((sum, line) => sum + line.cost, 0);
  return {
    lines,
    missingItems,
    totals: {
      revenue,
      cost,
      grossProfit: revenue - cost,
      marginRate: revenue > 0 ? Number(((revenue - cost) / revenue).toFixed(4)) : 0
    }
  };
}

function inventoryAdvice(data) {
  return Object.entries(data.inventory || {}).map(([sku, item]) => {
    const onHand = Number(item.onHand || 0);
    const lowStockAt = Number(item.lowStockAt || 0);
    const reorderTo = Number(item.reorderTo || lowStockAt * 2 || 0);
    const reorderQuantity = Math.max(0, reorderTo - onHand);
    return {
      sku,
      name: item.name || sku,
      unit: item.unit || "",
      onHand,
      lowStockAt,
      reorderTo,
      reorderQuantity,
      leadTimeDays: Number(item.leadTimeDays || 0),
      status: onHand <= 0 ? "out" : onHand <= lowStockAt ? "low" : "ok",
      advice: onHand <= lowStockAt ? `建議補 ${reorderQuantity} ${item.unit || ""} 到安全量 ${reorderTo}` : "庫存正常"
    };
  }).sort((a, b) => {
    const rank = { out: 0, low: 1, ok: 2 };
    return rank[a.status] - rank[b.status] || a.onHand - b.onHand;
  });
}

function aggregateInventoryDeductions(data, items = []) {
  const deductions = new Map();
  const missingItems = [];
  for (const line of items) {
    const catalogItem = findCatalogItem(data, line);
    const quantity = Math.max(1, Number(line.quantity || line.qty || 1));
    if (!catalogItem || !catalogItem.inventorySku) {
      missingItems.push({ name: line.name || line.id || line.sku || "", quantity });
      continue;
    }
    deductions.set(catalogItem.inventorySku, Number(deductions.get(catalogItem.inventorySku) || 0) + quantity);
  }
  return { deductions, missingItems };
}

async function deductRestaurantInventory(payload = {}) {
  let data = readRestaurantAiData();
  let items = Array.isArray(payload.items) ? payload.items : [];
  const refId = String(payload.orderId || payload.refId || "");
  if (!items.length && refId) {
    const order = await findOrder(refId);
    if (!order) throw new Error("Order not found");
    items = order.items || [];
  }
  if (!items.length) throw new Error("items or orderId is required");

  if (refId && (data.movements || []).some(movement => movement.type === "deduct" && movement.refId === refId)) {
    return {
      deducted: false,
      reason: "already_deducted",
      refId,
      inventory: inventoryAdvice(data)
    };
  }

  const { deductions, missingItems } = aggregateInventoryDeductions(data, items);
  const insufficient = [];
  for (const [sku, quantity] of deductions.entries()) {
    const inventoryItem = data.inventory[sku];
    if (!inventoryItem || Number(inventoryItem.onHand || 0) < quantity) {
      insufficient.push({ sku, requested: quantity, onHand: Number(inventoryItem?.onHand || 0) });
    }
  }
  if (insufficient.length && !payload.allowPartial) {
    return { deducted: false, reason: "insufficient_inventory", insufficient, missingItems };
  }

  const movementItems = [];
  for (const [sku, quantity] of deductions.entries()) {
    const inventoryItem = data.inventory[sku];
    if (!inventoryItem) continue;
    const before = Number(inventoryItem.onHand || 0);
    const used = payload.allowPartial ? Math.min(before, quantity) : quantity;
    inventoryItem.onHand = Math.max(0, before - used);
    movementItems.push({ sku, quantity: used, before, after: inventoryItem.onHand });
  }
  data.movements = Array.isArray(data.movements) ? data.movements : [];
  data.movements.unshift({
    id: `mov-${Date.now()}`,
    type: "deduct",
    refId,
    note: payload.note || "",
    items: movementItems,
    createdAt: nowIso()
  });
  data = writeRestaurantAiData(data);
  return {
    deducted: true,
    refId,
    items: movementItems,
    missingItems,
    inventory: inventoryAdvice(data)
  };
}

function taipeiDate(isoValue) {
  const date = isoValue ? new Date(isoValue) : new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function summarizeFeedback(feedback = [], options = {}) {
  const date = options.date || "";
  const rows = feedback.filter(item => !date || item.date === date || taipeiDate(item.createdAt || item.date) === date);
  const complaintWords = ["等", "慢", "冷", "錯", "漏", "少", "貴", "態度", "過敏", "太辣", "難吃"];
  const positiveWords = ["好吃", "新鮮", "回購", "快速", "親切", "份量", "清爽", "推薦"];
  const themes = new Map();
  const complaints = [];
  const positives = [];

  for (const item of rows) {
    const text = String(item.text || "");
    const isComplaint = item.type === "complaint" || Number(item.rating || 5) <= 2 || complaintWords.some(word => text.includes(word));
    const matchedPositive = positiveWords.filter(word => text.includes(word));
    const matchedComplaint = complaintWords.filter(word => text.includes(word));
    for (const word of [...matchedPositive, ...matchedComplaint]) themes.set(word, Number(themes.get(word) || 0) + 1);
    if (isComplaint) complaints.push(item);
    else positives.push(item);
  }

  return {
    count: rows.length,
    averageRating: rows.length ? Number((rows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / rows.length).toFixed(2)) : 0,
    complaints: complaints.length,
    positive: positives.length,
    themes: [...themes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count })),
    summary: rows.length
      ? `共 ${rows.length} 則回饋，客訴 ${complaints.length} 則，平均 ${rows.length ? (rows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / rows.length).toFixed(1) : "0"} 星。`
      : "目前沒有可摘要的評價或客訴。",
    actionItems: complaints.slice(0, 3).map(item => ({
      id: item.id || "",
      channel: item.channel || "",
      text: item.text || "",
      suggestion: "由店長回覆並標記處理狀態；若與溫度、等待或漏餐相關，回查尖峰出餐流程。"
    })),
    aiProvider: "rule-stub"
  };
}

function topItemsFromOrders(orders) {
  const totals = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.name || item.id || item.sku || "未命名品項";
      const current = totals.get(key) || { name: key, quantity: 0, revenue: 0 };
      const quantity = Number(item.quantity || 0);
      current.quantity += quantity;
      current.revenue += quantity * Number(item.price || 0);
      totals.set(key, current);
    }
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
}

async function buildDailyOwnerReport(date) {
  const data = readRestaurantAiData();
  const reportDate = date || taipeiDate();
  const orders = (await readOrders()).filter(order => taipeiDate(order.createdAt) === reportDate);
  const revenueOrders = orders.filter(order => !["cancelled", "rejected"].includes(statusKeyForServer(order)));
  const costing = calculateCosting(data, revenueOrders.flatMap(order => order.items || []));
  const byStatus = {};
  for (const order of orders) {
    const status = statusKeyForServer(order) || "unknown";
    byStatus[status] = Number(byStatus[status] || 0) + 1;
  }
  const advice = inventoryAdvice(data);
  const lowStock = advice.filter(item => item.status !== "ok");
  const feedbackSummary = summarizeFeedback(data.feedback || [], { date: reportDate });
  const aiBrief = [];
  aiBrief.push(`今日訂單 ${orders.length} 筆，營收 ${formatMoney(costing.totals.revenue)}，毛利 ${formatMoney(costing.totals.grossProfit)}。`);
  if (lowStock.length) aiBrief.push(`低庫存 ${lowStock.length} 項：${lowStock.slice(0, 3).map(item => item.name).join("、")}。`);
  if (feedbackSummary.complaints) aiBrief.push(`客訴 ${feedbackSummary.complaints} 則，優先處理等待、餐點溫度與漏餐問題。`);
  if (!lowStock.length && !feedbackSummary.complaints) aiBrief.push("庫存與回饋暫無重大警訊，可主推高毛利招牌餐。");

  return {
    date: reportDate,
    generatedAt: nowIso(),
    orders: {
      count: orders.length,
      byStatus,
      pendingAction: orders.filter(order => ["pending", "preparing"].includes(statusKeyForServer(order))).map(order => ({
        orderId: order.orderId,
        status: statusKeyForServer(order),
        pickupTime: order.pickupTime || ""
      }))
    },
    sales: {
      ...costing.totals,
      averageOrderValue: revenueOrders.length ? Number((costing.totals.revenue / revenueOrders.length).toFixed(2)) : 0,
      topItems: topItemsFromOrders(revenueOrders),
      missingCostItems: costing.missingItems
    },
    inventory: {
      lowStockCount: lowStock.length,
      lowStock,
      reorderSuggestions: lowStock.filter(item => item.reorderQuantity > 0)
    },
    feedback: feedbackSummary,
    aiBrief,
    aiProvider: "rule-stub"
  };
}

async function initDatabase() {
  if (!DATABASE_URL || databaseReady) return;
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });
  await pool.query(`
    create table if not exists orders (
      order_id text primary key,
      payload jsonb not null,
      status text not null,
      total numeric not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await pool.query(`
    create table if not exists customers (
      phone text primary key,
      name text not null,
      company text,
      order_count integer not null default 0,
      total_spent numeric not null default 0,
      last_order_id text,
      last_order_at timestamptz,
      updated_at timestamptz not null default now()
    );
  `);
  await pool.query("alter table customers add column if not exists loyalty_points integer not null default 0");
  await pool.query("alter table customers add column if not exists redeemed_points integer not null default 0");
  await pool.query("alter table customers add column if not exists referral_code text");
  await pool.query("alter table customers add column if not exists referred_by text");
  await pool.query(`
    create table if not exists member_ledger (
      id bigserial primary key,
      phone text not null,
      type text not null,
      points integer not null,
      label text not null,
      order_id text,
      note text,
      created_at timestamptz not null default now()
    );
  `);
  await pool.query("create index if not exists member_ledger_phone_idx on member_ledger (phone, created_at desc)");
  await backfillCustomers();
  await backfillLoyaltyAwards();
  databaseReady = true;
}

async function backfillCustomers() {
  const countResult = await pool.query("select count(*)::int as count from customers");
  if (Number(countResult.rows[0]?.count || 0) > 0) return;

  const ordersResult = await pool.query("select payload from orders order by created_at asc");
  const customers = new Map();
  for (const row of ordersResult.rows) {
    const order = row.payload || {};
    const phone = normalizePhone(order.customerPhone);
    if (!phone) continue;
    const current = customers.get(phone) || {
      phone,
      name: "",
      company: "",
      orderCount: 0,
      totalSpent: 0,
      lastOrderId: "",
      lastOrderAt: ""
    };
    current.name = order.customerName || current.name;
    current.company = order.companyName || current.company;
    current.orderCount += 1;
    current.totalSpent += Number(order.total || 0);
    current.lastOrderId = order.orderId;
    current.lastOrderAt = order.createdAt || nowIso();
    customers.set(phone, current);
  }

  for (const customer of customers.values()) {
    await pool.query(
      `
        insert into customers (phone, name, company, order_count, total_spent, last_order_id, last_order_at, referral_code, updated_at)
        values ($1, $2, $3, $4, $5, $6, $7, $8, now())
        on conflict (phone) do nothing
      `,
      [
        customer.phone,
        customer.name,
        customer.company,
        customer.orderCount,
        customer.totalSpent,
        customer.lastOrderId,
        customer.lastOrderAt,
        memberReferralCode(customer.phone)
      ]
    );
  }
}

async function backfillLoyaltyAwards() {
  const result = await pool.query("select order_id, payload from orders where status = 'completed' order by created_at asc");
  for (const row of result.rows) {
    const order = row.payload || {};
    const phone = normalizePhone(order.customerPhone);
    const points = loyaltyPointsForOrder(order);
    if (!phone || points <= 0) continue;

    const existing = await pool.query(
      "select id from member_ledger where order_id = $1 and type = 'earn' limit 1",
      [row.order_id]
    );
    if (existing.rows.length) {
      if (!order.loyaltyAwardedAt) {
        order.loyaltyPointsAwarded = points;
        order.loyaltyAwardedAt = order.completedAt || nowIso();
        await pool.query("update orders set payload = $2::jsonb, updated_at = now() where order_id = $1", [row.order_id, JSON.stringify(order)]);
      }
      continue;
    }

    await pool.query(
      `
        insert into customers (phone, name, company, loyalty_points, referral_code, updated_at)
        values ($1, $2, $3, $4, $5, now())
        on conflict (phone)
        do update set
          loyalty_points = customers.loyalty_points + $4,
          referral_code = coalesce(customers.referral_code, excluded.referral_code),
          updated_at = now()
      `,
      [phone, order.customerName || "", order.companyName || "", points, memberReferralCode(phone)]
    );
    await pool.query(
      `
        insert into member_ledger (phone, type, points, label, order_id, note, created_at)
        values ($1, 'earn', $2, '完成訂單集點', $3, $4, $5)
      `,
      [phone, points, row.order_id, `消費 ${formatMoney(order.total)}`, order.completedAt || nowIso()]
    );

    order.loyaltyPointsAwarded = points;
    order.loyaltyAwardedAt = order.completedAt || nowIso();
    await pool.query("update orders set payload = $2::jsonb, updated_at = now() where order_id = $1", [row.order_id, JSON.stringify(order)]);
  }
}

async function readOrders() {
  if (!DATABASE_URL) return readLocalOrders();
  await initDatabase();
  const result = await pool.query("select payload from orders order by created_at desc");
  return result.rows.map(row => row.payload);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function memberReferralCode(phone) {
  const digits = normalizePhone(phone);
  return digits ? `LAI${digits.slice(-6)}` : "";
}

function loyaltyPointsForOrder(order) {
  return Math.floor(Number(order.total || 0) / 100);
}

function normalizeMemberLedgerEntry(entry) {
  return {
    id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    phone: normalizePhone(entry.phone),
    type: entry.type || "adjust",
    points: Number(entry.points || 0),
    label: entry.label || "點數調整",
    orderId: entry.orderId || entry.order_id || "",
    note: entry.note || "",
    createdAt: entry.createdAt || entry.created_at || nowIso()
  };
}

function applyLedgerTotals(member, entry) {
  member.ledger.push(entry);
  member.loyaltyPoints += entry.points;
  if (entry.points < 0 && entry.type !== "gift_out") member.redeemedPoints += Math.abs(entry.points);
  if (entry.type === "gift_out") member.giftSent = Number(member.giftSent || 0) + Math.abs(entry.points);
  if (entry.type === "gift_in") member.giftReceived = Number(member.giftReceived || 0) + Number(entry.points || 0);
}

async function addMemberLedger(entry) {
  const normalized = normalizeMemberLedgerEntry(entry);
  if (!normalized.phone || !normalized.points) return normalized;

  if (!DATABASE_URL) {
    const ledger = readLocalMemberLedger();
    ledger.unshift(normalized);
    writeLocalMemberLedger(ledger);
    return normalized;
  }

  await initDatabase();
  const result = await pool.query(
    `
      insert into member_ledger (phone, type, points, label, order_id, note, created_at)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `,
    [normalized.phone, normalized.type, normalized.points, normalized.label, normalized.orderId || null, normalized.note, normalized.createdAt]
  );
  return normalizeMemberLedgerEntry(result.rows[0]);
}

async function upsertCustomerFromOrder(order, isNewOrder = false) {
  if (!DATABASE_URL) return;
  const phone = normalizePhone(order.customerPhone);
  if (!phone) return;
  await initDatabase();
  await pool.query(
    `
      insert into customers (phone, name, company, order_count, total_spent, last_order_id, last_order_at, referral_code, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8, now())
      on conflict (phone)
      do update set
        name = excluded.name,
        company = excluded.company,
        order_count = customers.order_count + $4,
        total_spent = customers.total_spent + $5,
        last_order_id = excluded.last_order_id,
        last_order_at = excluded.last_order_at,
        referral_code = coalesce(customers.referral_code, excluded.referral_code),
        updated_at = now()
    `,
    [
      phone,
      order.customerName || "",
      order.companyName || "",
      isNewOrder ? 1 : 0,
      isNewOrder ? Number(order.total || 0) : 0,
      order.orderId,
      order.createdAt || nowIso(),
      memberReferralCode(phone)
    ]
  );
}

async function writeOrder(order, options = {}) {
  if (!DATABASE_URL) {
    const orders = readLocalOrders();
    const index = orders.findIndex(item => item.orderId === order.orderId);
    if (index >= 0) orders[index] = order;
    else orders.unshift(order);
    writeLocalOrders(orders);
    return order;
  }

  await initDatabase();
  await pool.query(
    `
      insert into orders (order_id, payload, status, total, created_at, updated_at)
      values ($1, $2::jsonb, $3, $4, $5, now())
      on conflict (order_id)
      do update set payload = excluded.payload, status = excluded.status, total = excluded.total, updated_at = now()
    `,
    [order.orderId, JSON.stringify(order), order.status, Number(order.total || 0), order.createdAt || nowIso()]
  );
  await upsertCustomerFromOrder(order, Boolean(options.isNew));
  return order;
}

async function findOrder(orderId) {
  const orders = await readOrders();
  return orders.find(order => order.orderId === orderId);
}

async function findCustomerOrders(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { customer: null, orders: [] };
  const orders = (await readOrders()).filter(order => normalizePhone(order.customerPhone) === normalized);

  if (!DATABASE_URL) {
    const ledger = readLocalMemberLedger().map(normalizeMemberLedgerEntry).filter(entry => entry.phone === normalized);
    const loyaltyPoints = ledger.reduce((sum, entry) => sum + Number(entry.points || 0), 0);
    return {
      customer: orders[0] ? {
        phone: normalized,
        name: orders[0].customerName || "",
        company: orders[0].companyName || "",
        orderCount: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        loyaltyPoints,
        redeemedPoints: ledger.filter(entry => entry.points < 0).reduce((sum, entry) => sum + Math.abs(entry.points), 0),
        referralCode: memberReferralCode(normalized),
        lastOrderAt: orders[0].createdAt || ""
      } : null,
      orders
    };
  }

  await initDatabase();
  const result = await pool.query("select * from customers where phone = $1", [normalized]);
  const row = result.rows[0];
  return {
    customer: row ? {
      phone: row.phone,
      name: row.name,
      company: row.company || "",
      orderCount: Number(row.order_count || 0),
      totalSpent: Number(row.total_spent || 0),
      loyaltyPoints: Number(row.loyalty_points || 0),
      redeemedPoints: Number(row.redeemed_points || 0),
      referralCode: row.referral_code || memberReferralCode(normalized),
      referredBy: row.referred_by || "",
      lastOrderId: row.last_order_id,
      lastOrderAt: row.last_order_at
    } : null,
    orders
  };
}

function buildLocalMembers(orders, ledger) {
  const members = new Map();
  for (const order of orders) {
    const phone = normalizePhone(order.customerPhone);
    if (!phone) continue;
    const member = members.get(phone) || {
      phone,
      name: "",
      company: "",
      orderCount: 0,
      totalSpent: 0,
      completedSpent: 0,
      loyaltyPoints: 0,
      redeemedPoints: 0,
      giftSent: 0,
      giftReceived: 0,
      referralCode: memberReferralCode(phone),
      referredBy: "",
      lastOrderId: "",
      lastOrderAt: "",
      orders: [],
      ledger: []
    };
    member.name = order.customerName || member.name;
    member.company = order.companyName || member.company;
    member.orderCount += 1;
    member.totalSpent += Number(order.total || 0);
    if (statusKeyForServer(order) === "completed") member.completedSpent += Number(order.total || 0);
    member.lastOrderId = order.orderId || member.lastOrderId;
    member.lastOrderAt = order.createdAt || member.lastOrderAt;
    member.orders.push(order);
    members.set(phone, member);
  }

  for (const entry of ledger.map(normalizeMemberLedgerEntry)) {
    const member = members.get(entry.phone) || {
      phone: entry.phone,
      name: "",
      company: "",
      orderCount: 0,
      totalSpent: 0,
      completedSpent: 0,
      loyaltyPoints: 0,
      redeemedPoints: 0,
      giftSent: 0,
      giftReceived: 0,
      referralCode: memberReferralCode(entry.phone),
      referredBy: "",
      lastOrderId: "",
      lastOrderAt: "",
      orders: [],
      ledger: []
    };
    applyLedgerTotals(member, entry);
    members.set(entry.phone, member);
  }

  return [...members.values()].sort((a, b) => String(b.lastOrderAt).localeCompare(String(a.lastOrderAt)));
}

function statusKeyForServer(order) {
  return order.status === "accepted" ? "preparing" : order.status;
}

function backfillLocalLoyaltyAwards() {
  if (DATABASE_URL) return;
  const orders = readLocalOrders();
  const ledger = readLocalMemberLedger().map(normalizeMemberLedgerEntry);
  let changedOrders = false;
  let changedLedger = false;

  for (const order of orders) {
    const phone = normalizePhone(order.customerPhone);
    const points = loyaltyPointsForOrder(order);
    if (!phone || points <= 0 || statusKeyForServer(order) !== "completed") continue;
    const exists = ledger.some(entry => entry.type === "earn" && entry.orderId === order.orderId);
    if (!exists) {
      ledger.unshift(normalizeMemberLedgerEntry({
        phone,
        type: "earn",
        points,
        label: "完成訂單集點",
        orderId: order.orderId,
        note: `消費 ${formatMoney(order.total)}`,
        createdAt: order.completedAt || nowIso()
      }));
      changedLedger = true;
    }
    if (!order.loyaltyAwardedAt) {
      order.loyaltyPointsAwarded = points;
      order.loyaltyAwardedAt = order.completedAt || nowIso();
      changedOrders = true;
    }
  }

  if (changedOrders) writeLocalOrders(orders);
  if (changedLedger) writeLocalMemberLedger(ledger);
}

async function readMembers() {
  const orders = await readOrders();
  if (!DATABASE_URL) {
    backfillLocalLoyaltyAwards();
    return buildLocalMembers(readLocalOrders(), readLocalMemberLedger());
  }

  await initDatabase();
  const customersResult = await pool.query("select * from customers order by updated_at desc");
  const ledgerResult = await pool.query("select * from member_ledger order by created_at desc");
  const ledgerByPhone = new Map();
  for (const row of ledgerResult.rows) {
    const entry = normalizeMemberLedgerEntry(row);
    const list = ledgerByPhone.get(entry.phone) || [];
    list.push(entry);
    ledgerByPhone.set(entry.phone, list);
  }

  return customersResult.rows.map(row => {
    const phone = normalizePhone(row.phone);
    const memberOrders = orders.filter(order => normalizePhone(order.customerPhone) === phone);
    const completedSpent = memberOrders
      .filter(order => statusKeyForServer(order) === "completed")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const ledger = ledgerByPhone.get(phone) || [];
    const giftSent = ledger.filter(entry => entry.type === "gift_out").reduce((sum, entry) => sum + Math.abs(Number(entry.points || 0)), 0);
    const giftReceived = ledger.filter(entry => entry.type === "gift_in").reduce((sum, entry) => sum + Number(entry.points || 0), 0);
    return {
      phone,
      name: row.name || "",
      company: row.company || "",
      orderCount: Number(row.order_count || memberOrders.length || 0),
      totalSpent: Number(row.total_spent || 0),
      completedSpent,
      loyaltyPoints: Number(row.loyalty_points || 0),
      redeemedPoints: Number(row.redeemed_points || 0),
      giftSent,
      giftReceived,
      referralCode: row.referral_code || memberReferralCode(phone),
      referredBy: row.referred_by || "",
      lastOrderId: row.last_order_id || "",
      lastOrderAt: row.last_order_at || memberOrders[0]?.createdAt || "",
      orders: memberOrders,
      ledger
    };
  });
}

async function findMember(phone) {
  const normalized = normalizePhone(phone);
  const members = await readMembers();
  return members.find(member => member.phone === normalized) || null;
}

async function awardLoyaltyForCompletedOrder(order) {
  const phone = normalizePhone(order.customerPhone);
  if (!phone || order.loyaltyAwardedAt) return;
  const points = loyaltyPointsForOrder(order);
  if (points <= 0) return;

  if (DATABASE_URL) {
    await initDatabase();
    const existing = await pool.query(
      "select id from member_ledger where order_id = $1 and type = 'earn' limit 1",
      [order.orderId]
    );
    if (existing.rows.length) {
      order.loyaltyPointsAwarded = points;
      order.loyaltyAwardedAt = order.completedAt || nowIso();
      return;
    }
    await pool.query(
      `
        update customers
        set loyalty_points = loyalty_points + $2,
            referral_code = coalesce(referral_code, $3),
            updated_at = now()
        where phone = $1
      `,
      [phone, points, memberReferralCode(phone)]
    );
  } else {
    const existing = readLocalMemberLedger()
      .map(normalizeMemberLedgerEntry)
      .some(entry => entry.type === "earn" && entry.orderId === order.orderId);
    if (existing) {
      order.loyaltyPointsAwarded = points;
      order.loyaltyAwardedAt = order.completedAt || nowIso();
      return;
    }
  }

  await addMemberLedger({
    phone,
    type: "earn",
    points,
    label: "完成訂單集點",
    orderId: order.orderId,
    note: `消費 ${formatMoney(order.total)}`
  });
  order.loyaltyPointsAwarded = points;
  order.loyaltyAwardedAt = nowIso();
}

async function applyMemberPoints(phone, payload) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("Phone is required");
  const points = Number(payload.points || 0);
  if (!points) throw new Error("Points are required");

  const member = await findMember(normalized);
  const currentPoints = Number(member?.loyaltyPoints || 0);
  if (points < 0 && currentPoints + points < 0) throw new Error("會員點數不足");

  const label = payload.label || (points > 0 ? "手動加點" : "點數兌換");
  const type = payload.type || (points > 0 ? "adjust" : "redeem");

  if (DATABASE_URL) {
    await initDatabase();
    await pool.query(
      `
        insert into customers (phone, name, referral_code, updated_at)
        values ($1, $2, $3, now())
        on conflict (phone) do nothing
      `,
      [normalized, payload.name || member?.name || "", memberReferralCode(normalized)]
    );
    await pool.query(
      `
        update customers
        set loyalty_points = loyalty_points + $2,
            redeemed_points = redeemed_points + $3,
            updated_at = now()
        where phone = $1
      `,
      [normalized, points, points < 0 ? Math.abs(points) : 0]
    );
  }

  const entry = await addMemberLedger({
    phone: normalized,
    type,
    points,
    label,
    note: payload.note || ""
  });
  return { member: await findMember(normalized), entry };
}

async function sendMemberGift(fromPhone, payload) {
  const from = normalizePhone(fromPhone);
  const to = normalizePhone(payload.toPhone);
  const points = Number(payload.points || 0);
  if (!from || !to) throw new Error("Sender and receiver phone are required");
  if (from === to) throw new Error("不能送禮給自己");
  if (!Number.isInteger(points) || points <= 0) throw new Error("Gift points must be a positive integer");

  const sender = await findMember(from);
  if (!sender) throw new Error("找不到送禮會員");
  if (Number(sender.loyaltyPoints || 0) < points) throw new Error("會員點數不足，無法送禮");

  const note = payload.note || "好友點數禮券";
  const receiverName = payload.toName || "";

  if (DATABASE_URL) {
    await initDatabase();
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `
          insert into customers (phone, name, referral_code, updated_at)
          values ($1, $2, $3, now())
          on conflict (phone)
          do update set
            name = case when customers.name = '' then excluded.name else customers.name end,
            referral_code = coalesce(customers.referral_code, excluded.referral_code),
            updated_at = now()
        `,
        [to, receiverName, memberReferralCode(to)]
      );
      await client.query("update customers set loyalty_points = loyalty_points - $2, updated_at = now() where phone = $1", [from, points]);
      await client.query("update customers set loyalty_points = loyalty_points + $2, updated_at = now() where phone = $1", [to, points]);
      await client.query(
        "insert into member_ledger (phone, type, points, label, note, created_at) values ($1, 'gift_out', $2, $3, $4, now())",
        [from, -points, "送出好友禮券", `${note}｜收禮手機 ${to}`]
      );
      await client.query(
        "insert into member_ledger (phone, type, points, label, note, created_at) values ($1, 'gift_in', $2, $3, $4, now())",
        [to, points, "收到好友禮券", `${note}｜送禮手機 ${from}`]
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } else {
    await addMemberLedger({ phone: from, type: "gift_out", points: -points, label: "送出好友禮券", note: `${note}｜收禮手機 ${to}` });
    await addMemberLedger({ phone: to, type: "gift_in", points, label: "收到好友禮券", note: `${note}｜送禮手機 ${from}` });
  }

  return {
    sender: await findMember(from),
    receiver: await findMember(to)
  };
}

function buildKitchenTicket(order) {
  const lines = [];
  lines.push(order.companyName || (order.storeId === "hainan-singapore" ? "老王新加坡海南雞飯" : "LAI家便當"));
  lines.push("廚房接單小票");
  lines.push("------------------------------");
  lines.push(`訂單：${order.orderId}`);
  lines.push(`狀態：${order.status}`);
  lines.push(`方式：${order.pickupType}`);
  lines.push(`時間：${String(order.pickupTime).replace("T", " ")}`);
  lines.push(`客人：${order.customerName}`);
  lines.push(`電話：${order.customerPhone}`);
  if (order.companyName) lines.push(`公司：${order.companyName}`);
  if (order.prepMinutes) lines.push(`預估製作：${order.prepMinutes} 分鐘`);
  lines.push("------------------------------");
  for (const item of order.items || []) {
    lines.push(`${item.quantity} 份 ${item.name}`);
    lines.push(`  ${item.seriesName || item.series || ""}`);
  }
  lines.push("------------------------------");
  lines.push(`合計：${formatMoney(order.total)}`);
  lines.push(`備註：${order.orderNote || "無"}`);
  lines.push("\n\n");
  return lines.join("\n");
}

function escposText(text) {
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from(text, "utf8"),
    Buffer.from([0x1d, 0x56, 0x42, 0x00])
  ]);
}

function sendToNetworkPrinter(text) {
  return new Promise((resolve, reject) => {
    if (!PRINTER_HOST) {
      reject(new Error("PRINTER_HOST not configured"));
      return;
    }
    const socket = net.createConnection({ host: PRINTER_HOST, port: PRINTER_PORT, timeout: 5000 }, () => {
      socket.write(escposText(text), () => socket.end());
    });
    socket.on("close", resolve);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Printer connection timeout"));
    });
    socket.on("error", reject);
  });
}

function publicBaseUrlFromRequest(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function instanceUrl(req, instance, pathname, params = {}) {
  const url = new URL(pathname, publicBaseUrlFromRequest(req));
  url.searchParams.set("storeId", instance.id);
  url.searchParams.set("source", "telegram");
  url.searchParams.set("bot", instance.botUsername);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}

function telegramWebAppKeyboard(req, instance, activeTab = "") {
  return {
    inline_keyboard: [
      [
        {
          text: `${instance.shortName} 功能頁`,
          web_app: { url: instanceUrl(req, instance, instance.pagePath, { tab: activeTab }) }
        }
      ],
      [
        {
          text: "開始點餐",
          web_app: { url: instanceUrl(req, instance, instance.orderPath || instance.aiOrderPath || instance.pagePath) }
        },
        {
          text: "店址導航",
          url: instance.mapUrl
        }
      ],
      [
        {
          text: "後廚看板",
          web_app: { url: instanceUrl(req, instance, instance.kitchenPath, { role: "kitchen" }) }
        },
        {
          text: "老闆面板",
          web_app: { url: instanceUrl(req, instance, instance.managerPath, { role: "manager" }) }
        }
      ]
    ]
  };
}

function telegramReply(method, payload) {
  return { method, ...payload };
}

function classifyLai999Intent(text = "", message = {}) {
  const normalized = String(text || "").toLowerCase();
  if (message.location) return "location";
  if (/客服|聯絡|客訴|問題|help|support|complaint/.test(normalized)) return "support";
  if (/地址|定位|導航|在哪|location|map|where/.test(normalized)) return "location";
  if (/營業|幾點|開嗎|休息|hours|open/.test(normalized)) return "hours";
  if (/查詢|狀態|紀錄|訂單|order/.test(normalized) && extractPhone(text)) return "order_status";
  if (/訂餐|點餐|菜單|menu|order|start|開始|\/start/.test(normalized)) return "order";
  return "home";
}

function extractPhone(text = "") {
  const match = String(text || "").match(/(?:\+?\d[\d\s().-]{6,}\d)/);
  if (!match) return "";
  return match[0].replace(/[^\d+]/g, "");
}

function serviceReplyText(instance, intent) {
  if (intent === "location") {
    return [
      `${instance.name} 店址與導航`,
      "",
      `地址：${instance.address}`,
      `電話：${instance.phone}`,
      "",
      "點下方「店址導航」可直接開 Google Maps；也可以打開功能頁再點餐。"
    ].join("\n");
  }
  if (intent === "hours") {
    return [
      `${instance.name} 營業資訊`,
      "",
      ...(instance.hours || []).map(line => `- ${line}`),
      "",
      "尖峰或售完狀態以店內回覆為準。"
    ].join("\n");
  }
  if (intent === "support") {
    return [
      `${instance.name} 客服`,
      "",
      `電話：${instance.phone}`,
      "可詢問：營業時間、店址、菜單、訂餐、過敏忌口、訂單狀態。",
      "",
      "客訴或特殊需求請在功能頁留下內容，老闆面板會看到 AI 摘要。"
    ].join("\n");
  }
  if (intent === "order") {
    return [
      `${instance.name} AI 點餐`,
      "",
      "打開功能頁或直接開始點餐，可以選語言、桌號、忌口、過敏、加購推薦。",
      "送出後會同步到前台訂單、後廚看板與老闆報表。"
    ].join("\n");
  }
  return [
    `${instance.name} 已接到 ${LAI999_BOT_USERNAME}。`,
    "",
    "你可以使用下方功能頁完成 AI 點餐、查詢店址、基本客服、訂單紀錄查詢。",
    "客人送單後會進前台接單與後廚看板；完成訂單後會進老闆日報、成本與庫存扣減。"
  ].join("\n");
}

function statusTextForCustomer(status = "") {
  const labels = {
    pending: "已收到，等待店家確認",
    preparing: "製作中",
    accepted: "製作中",
    ready: "可取餐 / 準備出餐",
    completed: "已完成",
    rejected: "店家已拒單",
    cancelled: "已取消"
  };
  return labels[status] || status || "未知";
}

function formatCustomerOrderStatus(result) {
  const rows = (result.orders || []).slice(0, 3);
  if (!rows.length) return "目前查不到這支電話的訂單紀錄。請確認電話是否和下單時一致。";
  return [
    `${result.customer?.name || "客人"} 最近訂單`,
    "",
    ...rows.map(order => {
      const items = (order.items || []).map(item => `${item.name} x${item.quantity}`).join("、") || "未列餐點";
      return `${order.orderId}｜${statusTextForCustomer(order.status)}｜${items}｜${formatMoney(order.total)}`;
    })
  ].join("\n");
}

async function notifyTelegramOrderUpdate(order, eventName, req) {
  const chatId = order.telegramChatId || order.telegramUserId;
  if (!TELEGRAM_BOT_TOKEN || !chatId || order.botUsername !== LAI999_BOT_USERNAME) return;
  const instance = RESTAURANT_INSTANCES[order.storeId] || RESTAURANT_INSTANCES["hainan-singapore"];
  const eventLabels = {
    created: "訂單已收到",
    updated: "訂單內容已更新",
    preparing: "店家已接單，開始製作",
    ready: "餐點已完成，準備取餐",
    completed: "訂單已完成",
    rejected: "訂單已拒單",
    cancelled: "訂單已取消"
  };
  const text = [
    `${eventLabels[eventName] || "訂單狀態已更新"}：${order.orderId}`,
    `狀態：${statusTextForCustomer(order.status)}`,
    `金額：${formatMoney(order.total)}`,
    order.tableCode ? `桌號：${order.tableCode}` : ""
  ].filter(Boolean).join("\n");
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: telegramWebAppKeyboard(req, instance, "orders")
      })
    });
  } catch (error) {
    console.warn("telegram_order_notify_failed", error.message);
  }
}

function pickRestaurantInstance(text = "") {
  const normalized = String(text || "").toLowerCase();
  if (normalized.includes("hainan") || normalized.includes("海南") || normalized.includes("雞飯") || normalized.includes("chicken")) {
    return RESTAURANT_INSTANCES["hainan-singapore"];
  }
  return RESTAURANT_INSTANCES["hainan-singapore"];
}

async function handleLai999Webhook(req, res) {
  const update = await parseJsonBody(req);
  const message = update.message || update.edited_message || update.callback_query?.message;
  const chatId = message?.chat?.id;
  const text = update.message?.text || update.callback_query?.data || "";
  if (!chatId) {
    sendJson(res, 200, { ok: true, ignored: "no_chat" });
    return;
  }

  const instance = pickRestaurantInstance(text);
  const intent = classifyLai999Intent(text, message);
  const phone = intent === "order_status" ? extractPhone(text) : "";
  const replyText = phone
    ? formatCustomerOrderStatus(await findCustomerOrders(phone))
    : serviceReplyText(instance, intent);

  sendJson(res, 200, telegramReply("sendMessage", {
    chat_id: chatId,
    text: replyText,
    reply_markup: telegramWebAppKeyboard(req, instance, intent === "order_status" ? "orders" : intent)
  }));
}

async function handleApi(req, res, pathname) {
  const currentUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      storage: DATABASE_URL ? "postgres" : "local-json",
      pos: POS_WEBHOOK_URL ? "webhook-enabled" : "not-configured"
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/restaurants") {
    sendJson(res, 200, { restaurants: Object.values(RESTAURANT_INSTANCES) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/telegram/lai999/instance") {
    const instance = RESTAURANT_INSTANCES["hainan-singapore"];
    const baseUrl = publicBaseUrlFromRequest(req);
    sendJson(res, 200, {
      botUsername: LAI999_BOT_USERNAME,
      instance,
      webhookPath: "/api/telegram/lai999/webhook",
      featurePageUrl: instanceUrl(req, instance, instance.pagePath),
      orderPageUrl: instanceUrl(req, instance, instance.orderPath),
      publicBaseUrl: baseUrl,
      setupCommand: `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=${encodeURIComponent(new URL("/api/telegram/lai999/webhook", baseUrl).toString())}`,
      note: "Do not store the bot token in source files. Set the webhook from a secure shell or hosting secret."
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/telegram/lai999/webhook") {
    await handleLai999Webhook(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/restaurant-ai/menu") {
    const data = readRestaurantAiData();
    const lang = normalizeLang(currentUrl.searchParams.get("lang"));
    const structuredNote = buildDietaryNote({
      note: currentUrl.searchParams.get("note") || "",
      avoid: currentUrl.searchParams.getAll("avoid"),
      allergies: currentUrl.searchParams.getAll("allergy")
    });
    const menu = (data.menu || []).map(item => {
      const publicItem = publicCatalogItem({ ...item, kind: "menu" }, lang, data);
      return { ...publicItem, conflicts: itemConflicts(item, structuredNote) };
    });
    const addOns = (data.addOns || []).map(item => {
      const publicItem = publicCatalogItem({ ...item, kind: "addOn" }, lang, data);
      return { ...publicItem, conflicts: itemConflicts(item, structuredNote) };
    });
    sendJson(res, 200, {
      language: lang,
      menu,
      addOns,
      dietaryNote: structuredNote,
      aiProvider: "rule-stub"
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/restaurant-ai/dietary-note") {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, buildDietaryNote(payload));
    return;
  }

  if (req.method === "POST" && pathname === "/api/restaurant-ai/recommendations") {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, recommendMenu(readRestaurantAiData(), payload));
    return;
  }

  if (req.method === "POST" && pathname === "/api/restaurant-ai/upsells") {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, recommendUpsells(readRestaurantAiData(), payload));
    return;
  }

  if (req.method === "POST" && pathname === "/api/restaurant-ai/costing") {
    const payload = await parseJsonBody(req);
    const items = Array.isArray(payload.items) ? payload.items : [];
    sendJson(res, 200, {
      ...calculateCosting(readRestaurantAiData(), items),
      aiProvider: "rule-stub"
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/restaurant-ai/inventory/advice") {
    const data = readRestaurantAiData();
    const advice = inventoryAdvice(data);
    sendJson(res, 200, {
      inventory: advice,
      lowStock: advice.filter(item => item.status !== "ok"),
      aiProvider: "rule-stub"
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/restaurant-ai/inventory/deduct") {
    const payload = await parseJsonBody(req);
    try {
      const result = await deductRestaurantInventory(payload);
      sendJson(res, result.reason === "insufficient_inventory" ? 409 : 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/restaurant-ai/reports/daily") {
    sendJson(res, 200, await buildDailyOwnerReport(currentUrl.searchParams.get("date") || ""));
    return;
  }

  if (pathname === "/api/restaurant-ai/feedback/summary") {
    const data = readRestaurantAiData();
    if (req.method === "GET") {
      sendJson(res, 200, summarizeFeedback(data.feedback || [], { date: currentUrl.searchParams.get("date") || "" }));
      return;
    }
    if (req.method === "POST") {
      const payload = await parseJsonBody(req);
      const feedback = Array.isArray(payload.feedback) ? payload.feedback : [];
      if (payload.persist && feedback.length) {
        data.feedback = Array.isArray(data.feedback) ? data.feedback : [];
        for (const item of feedback) {
          data.feedback.unshift({
            id: item.id || `fb-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            date: item.date || taipeiDate(),
            type: item.type || "review",
            rating: Number(item.rating || 0),
            channel: item.channel || "manual",
            itemId: item.itemId || "",
            text: item.text || "",
            createdAt: item.createdAt || nowIso()
          });
        }
        writeRestaurantAiData(data);
      }
      sendJson(res, 200, summarizeFeedback(feedback.length ? feedback : data.feedback || [], { date: payload.date || "" }));
      return;
    }
  }

  if (req.method === "GET" && pathname === "/api/orders") {
    sendJson(res, 200, { orders: await readOrders() });
    return;
  }

  if (req.method === "GET" && pathname === "/api/members") {
    sendJson(res, 200, { members: await readMembers() });
    return;
  }

  const memberMatch = pathname.match(/^\/api\/members\/([^/]+)$/);
  if (req.method === "GET" && memberMatch) {
    const member = await findMember(decodeURIComponent(memberMatch[1]));
    if (!member) {
      sendJson(res, 404, { error: "Member not found" });
      return;
    }
    sendJson(res, 200, { member });
    return;
  }

  const memberRewardMatch = pathname.match(/^\/api\/members\/([^/]+)\/points$/);
  if (req.method === "POST" && memberRewardMatch) {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, await applyMemberPoints(decodeURIComponent(memberRewardMatch[1]), payload));
    return;
  }

  const memberGiftMatch = pathname.match(/^\/api\/members\/([^/]+)\/gift$/);
  if (req.method === "POST" && memberGiftMatch) {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, await sendMemberGift(decodeURIComponent(memberGiftMatch[1]), payload));
    return;
  }

  const customerMatch = pathname.match(/^\/api\/customers\/([^/]+)\/orders$/);
  if (req.method === "GET" && customerMatch) {
    sendJson(res, 200, await findCustomerOrders(decodeURIComponent(customerMatch[1])));
    return;
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    const payload = await parseJsonBody(req);
    const error = validateOrder(payload);
    if (error) {
      sendJson(res, 400, { error });
      return;
    }

    const total = payload.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price || 0), 0);
    const order = {
      orderId: createOrderId(payload),
      status: "pending",
      createdAt: nowIso(),
      ...payload,
      total
    };
    addTimeline(order, "pending", "網站送出訂單");
    await syncOrderToPos(order, "order.created");
    await writeOrder(order, { isNew: true });
    await notifyTelegramOrderUpdate(order, "created", req);
    sendJson(res, 201, { order });
    return;
  }

  const updateMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (req.method === "PATCH" && updateMatch) {
    const payload = await parseJsonBody(req);
    const order = await findOrder(decodeURIComponent(updateMatch[1]));
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    try {
      updateOrderDetails(order, payload);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    await syncOrderToPos(order, "order.updated");
    await writeOrder(order);
    await notifyTelegramOrderUpdate(order, "updated", req);
    sendJson(res, 200, { order });
    return;
  }

  const acceptMatch = pathname.match(/^\/api\/orders\/([^/]+)\/accept$/);
  if (req.method === "POST" && acceptMatch) {
    const order = await findOrder(decodeURIComponent(acceptMatch[1]));
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    applyStatus(order, "preparing", { prepMinutes: 20, note: "後台接單" });
    await syncOrderToPos(order, "order.preparing");
    await writeOrder(order);
    sendJson(res, 200, { order });
    return;
  }

  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (req.method === "POST" && statusMatch) {
    const payload = await parseJsonBody(req);
    const order = await findOrder(decodeURIComponent(statusMatch[1]));
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    try {
      applyStatus(order, payload.status, payload);
      if (payload.status === "completed") {
        await awardLoyaltyForCompletedOrder(order);
        order.costSnapshot = calculateCosting(readRestaurantAiData(), order.items || []);
        order.inventoryDeduction = await deductRestaurantInventory({
          orderId: order.orderId,
          items: order.items || [],
          note: "訂單完成自動扣庫存",
          allowPartial: true
        });
        addTimeline(order, "inventory", order.inventoryDeduction.deducted ? "已扣庫存" : `庫存未扣：${order.inventoryDeduction.reason || "unknown"}`);
      }
    } catch (error) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    await syncOrderToPos(order, `order.${payload.status}`);
    await writeOrder(order);
    await notifyTelegramOrderUpdate(order, payload.status, req);
    sendJson(res, 200, { order });
    return;
  }

  const printMatch = pathname.match(/^\/api\/orders\/([^/]+)\/print$/);
  if (req.method === "POST" && printMatch) {
    const order = await findOrder(decodeURIComponent(printMatch[1]));
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    if (order.status === "pending") {
      applyStatus(order, "preparing", { prepMinutes: 20, note: "列印時自動接單" });
      await syncOrderToPos(order, "order.preparing");
    }

    const ticket = buildKitchenTicket(order);
    let printResult = "file";
    try {
      await sendToNetworkPrinter(ticket);
      printResult = `network:${PRINTER_HOST}:${PRINTER_PORT}`;
    } catch {
      ensureDataFiles();
      const file = path.join(PRINT_DIR, `${order.orderId}.txt`);
      fs.writeFileSync(file, ticket, "utf8");
      printResult = `file:${file}`;
    }

    order.printedAt = nowIso();
    order.printCount = Number(order.printCount || 0) + 1;
    order.printResult = printResult;
    addTimeline(order, "print", printResult);
    await writeOrder(order);
    sendJson(res, 200, { order, printResult });
    return;
  }

  const posSyncMatch = pathname.match(/^\/api\/orders\/([^/]+)\/pos-sync$/);
  if (req.method === "POST" && posSyncMatch) {
    const order = await findOrder(decodeURIComponent(posSyncMatch[1]));
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    await syncOrderToPos(order, "order.manual-sync");
    await writeOrder(order);
    sendJson(res, 200, { order });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = decodeURIComponent(filePath);
  const fullPath = path.normalize(path.join(WEB_ROOT, filePath));

  if (!fullPath.startsWith(WEB_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

ensureDataFiles();

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`LAI order server running at http://0.0.0.0:${PORT}/`);
  console.log(`Storage: ${DATABASE_URL ? "PostgreSQL" : "local JSON"}`);
  if (PRINTER_HOST) console.log(`Network printer configured: ${PRINTER_HOST}:${PRINTER_PORT}`);
  if (POS_WEBHOOK_URL) console.log("POS webhook configured");
});
