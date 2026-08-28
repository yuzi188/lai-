let allOrders = [];
let knownPendingIds = new Set();
let soundEnabled = false;
let hasLoadedOnce = false;
let adminAuthenticated = false;
const adminBrand = document.body.dataset.adminBrand || "lai";

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function statusLabel(status) {
  const labels = {
    pending: "新單待接",
    preparing: "製作中",
    accepted: "製作中",
    ready: "可取餐",
    completed: "已完成",
    rejected: "已拒單",
    cancelled: "已取消",
    "local-only": "本機暫存"
  };
  return labels[status] || status;
}

function normalizedStatus(order) {
  return order.status === "accepted" ? "preparing" : order.status;
}

function orderDate(order) {
  const source = order.createdAt || order.pickupTime || "";
  return source.slice(0, 10);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(order) {
  return orderDate(order) === todayKey();
}

function itemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function isHainanOrder(order) {
  if (order.source === "hainan-official" || order.storeId === "hainan-singapore") return true;
  if (String(order.companyName || "").includes("海南雞")) return true;
  return (order.items || []).some(item => item.series === "hainan" || String(item.seriesName || "").includes("海南雞"));
}

function brandFilteredOrders(orders) {
  if (adminBrand === "hainan") return orders.filter(isHainanOrder);
  return orders;
}

function orderSourceBadge(order) {
  if (isHainanOrder(order)) return `<small class="order-source hainan-source">老王海南雞飯</small>`;
  return `<small class="order-source lai-source">LAI家便當</small>`;
}

function pickupTimeText(order) {
  return String(order.pickupTime || "").replace("T", " ") || "未填時間";
}

function shortTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16) || "--:--";
  return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function minutesUntil(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.round((new Date(value).getTime() - Date.now()) / 60000);
}

function urgencyText(order) {
  const minutes = minutesUntil(order.pickupTime);
  if (!Number.isFinite(minutes)) return "未排時間";
  if (minutes < 0) return `已逾時 ${Math.abs(minutes)} 分`;
  if (minutes <= 30) return `${minutes} 分內取餐`;
  if (minutes <= 120) return `${Math.round(minutes / 60)} 小時內`;
  return shortTime(order.pickupTime);
}

function readyEta(order) {
  if (!order.estimatedReadyAt) return "";
  const minutes = minutesUntil(order.estimatedReadyAt);
  if (minutes <= 0) return "應已完成";
  return `預計 ${minutes} 分後完成`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function actionButtons(order) {
  const status = normalizedStatus(order);
  if (status === "pending") {
    return `
      <button type="button" data-action="accept" data-minutes="15">接單 15分</button>
      <button type="button" data-action="accept" data-minutes="20">20分</button>
      <button type="button" data-action="accept" data-minutes="30">30分</button>
      <button type="button" data-action="edit">改單</button>
      <button type="button" data-action="reject" class="danger-action">拒單</button>
      <button type="button" data-action="print">列印</button>
    `;
  }
  if (status === "preparing") {
    return `
      <button type="button" data-action="ready">完成製作</button>
      <button type="button" data-action="edit">改單</button>
      <button type="button" data-action="print">補印</button>
    `;
  }
  if (status === "ready") {
    return `
      <button type="button" data-action="complete">取餐完成</button>
      <button type="button" data-action="print">補印</button>
    `;
  }
  return `<button type="button" data-action="print">補印</button>`;
}

function orderCard(order) {
  const status = normalizedStatus(order);
  const items = (order.items || []).map(item => `
    <li>
      <strong>${Number(item.quantity || 0)} 份</strong>
      <span>${escapeHtml(item.name)}</span>
    </li>
  `).join("");
  const note = order.orderNote ? `<p class="order-note">備註：${escapeHtml(order.orderNote)}</p>` : "";
  const changeLine = order.changeCount ? `<p class="order-note">已改單 ${Number(order.changeCount)} 次：${escapeHtml(order.lastChangeNote || "內容更新")}</p>` : "";
  const printLine = order.printResult ? `<p class="admin-print-result">已列印 ${order.printCount || 1} 次</p>` : "";
  const eta = status === "preparing" ? `<b class="eta-line">${readyEta(order)}</b>` : "";

  return `
    <article class="admin-order status-${status}" data-order-id="${escapeHtml(order.orderId)}">
      <header>
        <div>
          <strong>${escapeHtml(order.orderId)}</strong>
          <small>${pickupTimeText(order)}</small>
          ${orderSourceBadge(order)}
        </div>
        <span>${statusLabel(status)}</span>
      </header>
      <div class="order-customer">
        <b>${escapeHtml(order.customerName || "未填姓名")}</b>
        <span>${escapeHtml(order.customerPhone || "未填電話")}</span>
        ${order.companyName ? `<span>${escapeHtml(order.companyName)}</span>` : ""}
      </div>
      <div class="order-meta-row">
        <span>${escapeHtml(order.pickupType || "未填方式")}</span>
        <span>${urgencyText(order)}</span>
        <strong>${itemCount(order)} 份 · ${money(order.total)}</strong>
      </div>
      ${eta}
      <ul class="order-item-list">${items}</ul>
      ${note}
      ${changeLine}
      ${printLine}
      <div class="admin-actions">${actionButtons(order)}</div>
    </article>
  `;
}

function matchesFilters(order) {
  const keyword = document.querySelector("#orderSearch").value.trim().toLowerCase();
  const keywordDigits = keyword.replace(/\D/g, "");
  const status = document.querySelector("#statusFilter").value;
  const date = document.querySelector("#dateFilter").value;
  const haystack = [
    order.orderId,
    order.customerName,
    order.customerPhone,
    order.companyName,
    order.pickupType,
    order.tableCode,
    order.orderNote,
    ...(order.items || []).map(item => `${item.seriesName || ""} ${item.name}`)
  ].join(" ").toLowerCase();
  const digitHaystack = [order.orderId, order.customerPhone, order.tableCode].join(" ").replace(/\D/g, "");

  if (keyword && !haystack.includes(keyword) && !(keywordDigits && digitHaystack.includes(keywordDigits))) return false;
  if (status !== "all" && normalizedStatus(order) !== status) return false;
  if (date && orderDate(order) !== date) return false;
  return true;
}

function sortedByPickup(orders) {
  return [...orders].sort((a, b) => {
    const aTime = a.pickupTime ? new Date(a.pickupTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.pickupTime ? new Date(b.pickupTime).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function countByStatus(status) {
  return allOrders.filter(order => normalizedStatus(order) === status).length;
}

function renderStats() {
  const todayOrders = allOrders.filter(isToday).filter(order => !["rejected", "cancelled"].includes(normalizedStatus(order)));
  const todayItems = todayOrders.reduce((sum, order) => sum + itemCount(order), 0);

  document.querySelector("#todayOrders").textContent = todayOrders.length;
  document.querySelector("#todayItems").textContent = todayItems;
  document.querySelector("#pendingCount").textContent = countByStatus("pending");
  document.querySelector("#preparingCount").textContent = countByStatus("preparing");
  document.querySelector("#readyCount").textContent = countByStatus("ready");
  document.querySelector("#pendingBadge").textContent = countByStatus("pending");
  document.querySelector("#preparingBadge").textContent = countByStatus("preparing");
  document.querySelector("#readyBadge").textContent = countByStatus("ready");

  const itemMap = new Map();
  for (const order of todayOrders) {
    for (const item of order.items || []) {
      const current = itemMap.get(item.name) || { quantity: 0, amount: 0 };
      current.quantity += Number(item.quantity || 0);
      current.amount += Number(item.quantity || 0) * Number(item.price || 0);
      itemMap.set(item.name, current);
    }
  }

  const rows = [...itemMap.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .map(([name, stat]) => `
      <div class="item-stat-row">
        <span>${escapeHtml(name)}</span>
        <strong>${stat.quantity} 份</strong>
        <b>${money(stat.amount)}</b>
      </div>
    `);
  document.querySelector("#itemStats").innerHTML = rows.length ? rows.join("") : "<p>今日尚無品項銷售資料</p>";
}

function renderColumn(selector, orders, emptyText) {
  document.querySelector(selector).innerHTML = orders.length ? orders.map(orderCard).join("") : `<p class="empty-state">${emptyText}</p>`;
}

function renderOrders() {
  const filtered = allOrders.filter(matchesFilters);
  const pending = sortedByPickup(filtered.filter(order => normalizedStatus(order) === "pending"));
  const preparing = sortedByPickup(filtered.filter(order => normalizedStatus(order) === "preparing"));
  const ready = sortedByPickup(filtered.filter(order => normalizedStatus(order) === "ready"));
  const history = sortedByPickup(filtered.filter(order => ["completed", "rejected", "cancelled"].includes(normalizedStatus(order)))).reverse();

  renderColumn("#pendingOrders", pending, "目前沒有新單");
  renderColumn("#preparingOrders", preparing, "目前沒有製作中的訂單");
  renderColumn("#readyOrders", ready, "目前沒有可取餐訂單");
  renderColumn("#historyOrders", history, "沒有符合條件的歷史訂單");
  document.querySelector("#historyBadge").textContent = history.length;
}

function beep() {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
}

function detectNewPendingOrders(orders) {
  const pendingIds = new Set(orders.filter(order => normalizedStatus(order) === "pending").map(order => order.orderId));
  const hasNew = hasLoadedOnce && [...pendingIds].some(id => !knownPendingIds.has(id));
  knownPendingIds = pendingIds;
  hasLoadedOnce = true;
  if (hasNew) beep();
}

async function loadOrders() {
  const { orders } = await api("/api/orders");
  allOrders = brandFilteredOrders(orders || []);
  detectNewPendingOrders(allOrders);
  renderStats();
  renderOrders();
}

async function setStatus(orderId, status, payload = {}) {
  await api(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status, ...payload })
  });
}

async function editOrder(orderId) {
  const order = allOrders.find(item => item.orderId === orderId);
  if (!order) throw new Error("找不到訂單");
  const orderNote = prompt("更新備註", order.orderNote || "");
  if (orderNote === null) return;
  const tableCode = prompt("更新桌號 / 取餐代號", order.tableCode || "");
  if (tableCode === null) return;
  const pickupTime = prompt("更新取餐時間，格式 YYYY-MM-DDTHH:mm", order.pickupTime || "");
  if (pickupTime === null) return;
  await api(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      orderNote,
      tableCode,
      pickupTime,
      changeNote: "後台更改備註、桌號或取餐時間"
    })
  });
}

async function handleAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  event.stopPropagation();
  const card = button.closest("[data-order-id]");
  const orderId = card.dataset.orderId;
  const action = button.dataset.action;
  button.disabled = true;

  try {
    if (action === "accept") await setStatus(orderId, "preparing", { prepMinutes: Number(button.dataset.minutes || 20), note: "店員接單" });
    if (action === "reject") await setStatus(orderId, "rejected", { note: "店員拒單" });
    if (action === "ready") await setStatus(orderId, "ready", { note: "餐點已完成" });
    if (action === "complete") await setStatus(orderId, "completed", { note: "客人已取餐" });
    if (action === "print") await api(`/api/orders/${encodeURIComponent(orderId)}/print`, { method: "POST", body: "{}" });
    if (action === "edit") await editOrder(orderId);
    await loadOrders();
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
}

function ensureAdminLoginOverlay() {
  if (document.querySelector("#adminLoginOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "adminLoginOverlay";
  overlay.className = "admin-login-overlay";
  overlay.innerHTML = `
    <form id="adminLoginForm" class="admin-login-card">
      <p>ADMIN LOGIN</p>
      <h2>${adminBrand === "hainan" ? "海南雞接單後台" : "接單後台"}</h2>
      <span id="adminLoginMessage">請輸入後台密碼。</span>
      <label>後台密碼
        <input id="adminPassword" type="password" autocomplete="current-password" required>
      </label>
      <button type="submit">登入後台</button>
    </form>
  `;
  document.body.appendChild(overlay);
  document.querySelector("#adminLoginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const password = document.querySelector("#adminPassword").value;
    const message = document.querySelector("#adminLoginMessage");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "登入失敗");
      overlay.remove();
      adminAuthenticated = true;
      await loadOrders();
    } catch (error) {
      message.textContent = error.message;
      message.dataset.tone = "error";
    }
  });
}

async function ensureAdminSession() {
  const response = await fetch("/api/admin/session", { credentials: "same-origin" });
  const data = await response.json();
  if (!data.configured || !data.authenticated) {
    ensureAdminLoginOverlay();
    const message = document.querySelector("#adminLoginMessage");
    if (!data.configured) {
      message.textContent = "尚未設定 ADMIN_PASSWORD，後台資料目前已鎖定。";
      message.dataset.tone = "error";
    }
    return false;
  }
  return true;
}

function orderDetailHtml(order) {
  const timeline = (order.timeline || []).slice().reverse().map(item => `
    <li>
      <span>${escapeHtml(String(item.at || "").replace("T", " ").slice(0, 19))}</span>
      <strong>${escapeHtml(statusLabel(item.status) || item.status)}</strong>
      <em>${escapeHtml(item.note || "")}</em>
    </li>
  `).join("");
  const items = (order.items || []).map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${Number(item.quantity || 0)}</td>
      <td>${money(item.price)}</td>
      <td>${money(Number(item.quantity || 0) * Number(item.price || 0))}</td>
    </tr>
  `).join("");
  return `
    <div class="detail-grid">
      <article>
        <h3>客戶資料</h3>
        <dl class="detail-list">
          <div><dt>姓名</dt><dd>${escapeHtml(order.customerName || "-")}</dd></div>
          <div><dt>電話</dt><dd>${escapeHtml(order.customerPhone || "-")}</dd></div>
          <div><dt>桌號/代號</dt><dd>${escapeHtml(order.tableCode || "-")}</dd></div>
          <div><dt>取餐方式</dt><dd>${escapeHtml(order.pickupType || "-")}</dd></div>
          <div><dt>取餐時間</dt><dd>${escapeHtml(pickupTimeText(order))}</dd></div>
        </dl>
      </article>
      <article>
        <h3>訂單狀態</h3>
        <dl class="detail-list">
          <div><dt>單號</dt><dd>${escapeHtml(order.orderId)}</dd></div>
          <div><dt>狀態</dt><dd>${escapeHtml(statusLabel(normalizedStatus(order)))}</dd></div>
          <div><dt>建立</dt><dd>${escapeHtml(String(order.createdAt || "").replace("T", " ").slice(0, 19))}</dd></div>
          <div><dt>總金額</dt><dd>${money(order.total)}</dd></div>
          <div><dt>列印</dt><dd>${escapeHtml(order.printResult || "尚未列印")}</dd></div>
        </dl>
      </article>
    </div>
    <section>
      <h3>餐點明細</h3>
      <div class="detail-table-wrap">
        <table class="admin-data-table detail-items-table">
          <thead><tr><th>品項</th><th>數量</th><th>單價</th><th>小計</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>
      <p class="detail-total">合計 ${money(order.total)}</p>
    </section>
    <section>
      <h3>備註</h3>
      <p>${escapeHtml(order.orderNote || "無")}</p>
    </section>
    <section>
      <h3>處理紀錄</h3>
      <ul class="detail-timeline">${timeline || "<li>尚無紀錄</li>"}</ul>
    </section>
  `;
}

function ensureOrderDetailModal() {
  if (document.querySelector("#adminOrderDetailModal")) return;
  const modal = document.createElement("div");
  modal.id = "adminOrderDetailModal";
  modal.className = "admin-detail-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="admin-detail-backdrop" data-close-admin-detail></div>
    <article class="admin-detail-panel" role="dialog" aria-modal="true" aria-labelledby="adminDetailTitle">
      <button class="dish-modal-close" type="button" data-close-admin-detail aria-label="關閉">×</button>
      <header>
        <div>
          <p class="hainan-kicker">ORDER DETAIL</p>
          <h2 id="adminDetailTitle">訂單明細</h2>
        </div>
        <span id="adminDetailStatus" class="table-status">--</span>
      </header>
      <div id="adminDetailBody" class="admin-detail-body"></div>
    </article>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", event => {
    if (!event.target.closest("[data-close-admin-detail]")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
}

function openOrderDetail(orderId) {
  const order = allOrders.find(item => item.orderId === orderId);
  if (!order) return;
  ensureOrderDetailModal();
  document.querySelector("#adminDetailTitle").textContent = order.orderId;
  document.querySelector("#adminDetailStatus").textContent = statusLabel(normalizedStatus(order));
  document.querySelector("#adminDetailBody").innerHTML = orderDetailHtml(order);
  const modal = document.querySelector("#adminOrderDetailModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function handleOrderCardOpen(event) {
  if (event.target.closest("button, a, input, select, textarea")) return;
  const card = event.target.closest("[data-order-id]");
  if (!card) return;
  openOrderDetail(card.dataset.orderId);
}

function applyQuickFilter(event) {
  const dateButton = event.target.closest("[data-quick-date]");
  const statusButton = event.target.closest("[data-quick-status]");
  if (dateButton) {
    document.querySelector("#dateFilter").value = dateButton.dataset.quickDate === "today" ? todayKey() : "";
    renderOrders();
  }
  if (statusButton) {
    document.querySelector("#statusFilter").value = statusButton.dataset.quickStatus;
    renderOrders();
  }
}

function updateClock() {
  document.querySelector("#adminClock").textContent = new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.querySelector("#soundToggle").textContent = `提醒音：${soundEnabled ? "開" : "關"}`;
  if (soundEnabled) beep();
}

document.querySelector(".admin-refresh").addEventListener("click", loadOrders);
document.querySelector(".delivery-board").addEventListener("click", handleAction);
document.querySelector(".delivery-board").addEventListener("click", handleOrderCardOpen);
document.querySelector(".quick-filters").addEventListener("click", applyQuickFilter);
document.querySelector("#soundToggle").addEventListener("click", toggleSound);
document.querySelector("#orderSearch").addEventListener("input", renderOrders);
document.querySelector("#statusFilter").addEventListener("change", renderOrders);
document.querySelector("#dateFilter").addEventListener("change", renderOrders);

updateClock();
setInterval(updateClock, 1000);
ensureAdminSession().then(authenticated => {
  adminAuthenticated = authenticated;
  if (adminAuthenticated) loadOrders().catch(error => alert(error.message));
});
setInterval(() => {
  if (adminAuthenticated) loadOrders().catch(console.error);
}, 5000);
