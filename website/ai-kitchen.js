let orders = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

function statusKey(order) {
  return order.status === "accepted" ? "preparing" : order.status;
}

function isToday(order) {
  return String(order.createdAt || "").slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function shortTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16) || "--:--";
  return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function hasAllergy(order) {
  return Boolean(order.dietaryNote?.flags?.hasAllergy || String(order.orderNote || "").includes("過敏"));
}

function actionButtons(order) {
  const status = statusKey(order);
  if (status === "pending") return `<button type="button" data-action="accept">開始製作</button>`;
  if (status === "preparing") return `<button type="button" data-action="ready">完成製作</button>`;
  if (status === "ready") return `<button type="button" data-action="complete">已出餐</button>`;
  return "";
}

function orderCard(order) {
  const note = order.dietaryNote?.kitchenNote || order.orderNote || "無特殊備註";
  const changeLine = order.changeCount ? `<p class="order-note">已改單 ${Number(order.changeCount)} 次：${escapeHtml(order.lastChangeNote || "內容更新")}</p>` : "";
  const items = (order.items || []).map(item => `
    <li><strong>${Number(item.quantity || 0)} 份</strong><span>${escapeHtml(item.name)}</span></li>
  `).join("");
  return `
    <article class="admin-order ai-os-ticket ${hasAllergy(order) ? "has-allergy" : ""}" data-order-id="${escapeHtml(order.orderId)}">
      <header>
        <div>
          <strong>${escapeHtml(order.tableCode || order.pickupType || "未填桌號")}</strong>
          <small>${escapeHtml(order.orderId)}・${shortTime(order.createdAt)}</small>
        </div>
        <span>${escapeHtml(statusKey(order))}</span>
      </header>
      <ul class="order-item-list">${items}</ul>
      ${changeLine}
      <p class="order-note">${escapeHtml(note)}</p>
      <div class="ai-os-ticket-meta">
        <span>${escapeHtml(order.language || "zh-TW")}</span>
        <span>${escapeHtml(order.customerName || "現場客")}</span>
        <span>${escapeHtml(order.pickupType || "內用")}</span>
      </div>
      <div class="admin-actions">${actionButtons(order)}</div>
    </article>
  `;
}

function sortForKitchen(rows) {
  return [...rows].sort((a, b) => new Date(a.createdAt || a.pickupTime || 0) - new Date(b.createdAt || b.pickupTime || 0));
}

function renderColumn(selector, rows, emptyText) {
  document.querySelector(selector).innerHTML = rows.length ? rows.map(orderCard).join("") : `<p class="empty-state">${emptyText}</p>`;
}

function count(status) {
  return orders.filter(order => statusKey(order) === status).length;
}

function render() {
  const pending = sortForKitchen(orders.filter(order => statusKey(order) === "pending"));
  const preparing = sortForKitchen(orders.filter(order => statusKey(order) === "preparing"));
  const ready = sortForKitchen(orders.filter(order => statusKey(order) === "ready"));
  renderColumn("#pendingOrders", pending, "目前沒有待接單");
  renderColumn("#preparingOrders", preparing, "目前沒有製作中訂單");
  renderColumn("#readyOrders", ready, "目前沒有可出餐訂單");
  document.querySelector("#pendingCount").textContent = pending.length;
  document.querySelector("#preparingCount").textContent = preparing.length;
  document.querySelector("#readyCount").textContent = ready.length;
  document.querySelector("#allergyCount").textContent = orders.filter(order => isToday(order) && hasAllergy(order)).length;
  document.querySelector("#completedCount").textContent = orders.filter(order => isToday(order) && statusKey(order) === "completed").length;
  document.querySelector("#pendingBadge").textContent = pending.length;
  document.querySelector("#preparingBadge").textContent = preparing.length;
  document.querySelector("#readyBadge").textContent = ready.length;
}

async function loadOrders() {
  const data = await api("/api/orders");
  orders = data.orders || [];
  render();
}

async function updateStatus(orderId, status) {
  await api(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status, note: "AI 後廚看板更新" })
  });
  await loadOrders();
}

document.querySelector("#refreshButton").addEventListener("click", () => loadOrders().catch(error => alert(error.message)));
document.querySelector(".delivery-board").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const orderId = button.closest("[data-order-id]").dataset.orderId;
  const next = { accept: "preparing", ready: "ready", complete: "completed" }[button.dataset.action];
  button.disabled = true;
  updateStatus(orderId, next).catch(error => {
    alert(error.message);
    button.disabled = false;
  });
});

function tick() {
  document.querySelector("#kitchenClock").textContent = new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

tick();
setInterval(tick, 1000);
loadOrders().catch(error => alert(error.message));
setInterval(() => loadOrders().catch(console.error), 5000);
