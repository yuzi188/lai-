const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");

const ROOT = __dirname;
const WEB_ROOT = path.join(ROOT, "website");
const DATA_DIR = path.join(ROOT, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const MEMBER_LEDGER_FILE = path.join(DATA_DIR, "member-ledger.json");
const PRINT_DIR = path.join(DATA_DIR, "print-jobs");
const PORT = Number(process.env.PORT || 4180);
const DATABASE_URL = process.env.DATABASE_URL || "";
const PRINTER_HOST = process.env.PRINTER_HOST || "";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);
const POS_WEBHOOK_URL = process.env.POS_WEBHOOK_URL || "";
const POS_API_KEY = process.env.POS_API_KEY || "";
const POS_TIMEOUT_MS = Number(process.env.POS_TIMEOUT_MS || 8000);

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

function createOrderId() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `LAI-${stamp}-${String(now.getTime()).slice(-5)}`;
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
      referralCode: memberReferralCode(entry.phone),
      referredBy: "",
      lastOrderId: "",
      lastOrderAt: "",
      orders: [],
      ledger: []
    };
    member.ledger.push(entry);
    member.loyaltyPoints += entry.points;
    if (entry.points < 0) member.redeemedPoints += Math.abs(entry.points);
    members.set(entry.phone, member);
  }

  return [...members.values()].sort((a, b) => String(b.lastOrderAt).localeCompare(String(a.lastOrderAt)));
}

function statusKeyForServer(order) {
  return order.status === "accepted" ? "preparing" : order.status;
}

async function readMembers() {
  const orders = await readOrders();
  if (!DATABASE_URL) return buildLocalMembers(orders, readLocalMemberLedger());

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
    return {
      phone,
      name: row.name || "",
      company: row.company || "",
      orderCount: Number(row.order_count || memberOrders.length || 0),
      totalSpent: Number(row.total_spent || 0),
      completedSpent,
      loyaltyPoints: Number(row.loyalty_points || 0),
      redeemedPoints: Number(row.redeemed_points || 0),
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

function buildKitchenTicket(order) {
  const lines = [];
  lines.push("LAI家便當");
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

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      storage: DATABASE_URL ? "postgres" : "local-json",
      pos: POS_WEBHOOK_URL ? "webhook-enabled" : "not-configured"
    });
    return;
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
      orderId: createOrderId(),
      status: "pending",
      createdAt: nowIso(),
      ...payload,
      total
    };
    addTimeline(order, "pending", "網站送出訂單");
    await syncOrderToPos(order, "order.created");
    await writeOrder(order, { isNew: true });
    sendJson(res, 201, { order });
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
      if (payload.status === "completed") await awardLoyaltyForCompletedOrder(order);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    await syncOrderToPos(order, `order.${payload.status}`);
    await writeOrder(order);
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
