let pageOrders = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function orderDate(order) {
  return String(order.createdAt || order.pickupTime || "").slice(0, 10);
}

function statusKey(order) {
  return order.status === "accepted" ? "preparing" : order.status;
}

function statusLabel(status) {
  const labels = {
    pending: "新單待接",
    preparing: "製作中",
    ready: "可取餐",
    completed: "已完成",
    rejected: "已拒單",
    cancelled: "已取消"
  };
  return labels[status] || status;
}

function itemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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

function updateClock() {
  const clock = document.querySelector("#adminClock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

async function loadOrders() {
  const { orders } = await api("/api/orders");
  pageOrders = orders || [];
  renderPage();
}

function orderSearchText(order) {
  return [
    order.orderId,
    order.customerName,
    order.customerPhone,
    order.companyName,
    order.orderNote,
    ...(order.items || []).map(item => `${item.seriesName || ""} ${item.name}`)
  ].join(" ").toLowerCase();
}

function filteredOrdersForSearch() {
  const keyword = document.querySelector("#pageSearch")?.value.trim().toLowerCase() || "";
  const status = document.querySelector("#pageStatus")?.value || "all";
  const date = document.querySelector("#pageDate")?.value || "";
  return pageOrders.filter(order => {
    if (keyword && !orderSearchText(order).includes(keyword)) return false;
    if (status !== "all" && statusKey(order) !== status) return false;
    if (date && orderDate(order) !== date) return false;
    return true;
  });
}

function renderOrdersPage() {
  const rows = filteredOrdersForSearch().map(order => {
    const items = (order.items || []).map(item => `${item.quantity}x ${item.name}`).join("、");
    return `
      <tr>
        <td>${escapeHtml(String(order.pickupTime || order.createdAt || "").replace("T", " "))}</td>
        <td><strong>${escapeHtml(order.orderId)}</strong></td>
        <td>${escapeHtml(order.customerName || "")}<br><small>${escapeHtml(order.customerPhone || "")}</small></td>
        <td>${escapeHtml(items)}</td>
        <td><strong>${money(order.total)}</strong></td>
        <td><span class="table-status">${statusLabel(statusKey(order))}</span></td>
        <td><button type="button" data-print-id="${escapeHtml(order.orderId)}">補印</button></td>
      </tr>
    `;
  });
  document.querySelector("#ordersTable").innerHTML = rows.length ? rows.join("") : `<tr><td colspan="7">沒有符合條件的訂單</td></tr>`;
  document.querySelector("#pageCount").textContent = rows.length;
}

function selectedStatsOrders() {
  const date = document.querySelector("#statsDate")?.value || todayKey();
  const range = document.querySelector("#statsRange")?.value || "day";
  return pageOrders.filter(order => {
    if (["rejected", "cancelled"].includes(statusKey(order))) return false;
    return range === "all" || orderDate(order) === date;
  });
}

function renderStatsPage() {
  const orders = selectedStatsOrders();
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const items = orders.reduce((sum, order) => sum + itemCount(order), 0);
  const completed = orders.filter(order => statusKey(order) === "completed").length;
  document.querySelector("#statsRevenue").textContent = money(revenue);
  document.querySelector("#statsOrders").textContent = orders.length;
  document.querySelector("#statsItems").textContent = items;
  document.querySelector("#statsAvg").textContent = money(orders.length ? Math.round(revenue / orders.length) : 0);
  document.querySelector("#statsDone").textContent = completed;

  const productMap = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const stat = productMap.get(item.name) || { quantity: 0, amount: 0 };
      stat.quantity += Number(item.quantity || 0);
      stat.amount += Number(item.quantity || 0) * Number(item.price || 0);
      productMap.set(item.name, stat);
    }
  }
  document.querySelector("#statsProducts").innerHTML = [...productMap.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)
    .map(([name, stat]) => `<div class="item-stat-row"><span>${escapeHtml(name)}</span><strong>${stat.quantity} 份</strong><b>${money(stat.amount)}</b></div>`)
    .join("") || "<p>目前沒有銷售資料</p>";

  const total = Math.max(pageOrders.length, 1);
  const statuses = ["pending", "preparing", "ready", "completed", "rejected", "cancelled"];
  document.querySelector("#statsStatus").innerHTML = statuses.map(status => {
    const count = pageOrders.filter(order => statusKey(order) === status).length;
    const width = Math.round((count / total) * 100);
    return `<div class="status-bar-row"><span>${statusLabel(status)}</span><b>${count}</b><i style="width:${width}%"></i></div>`;
  }).join("");
}

function renderPrintPage() {
  const printed = pageOrders.filter(order => order.printedAt).sort((a, b) => String(b.printedAt).localeCompare(String(a.printedAt)));
  document.querySelector("#printMode").textContent = printed.some(order => String(order.printResult || "").startsWith("network:")) ? "網路印表機" : "備用檔案";
  document.querySelector("#printedCountPage").textContent = printed.length;
  document.querySelector("#printJobsList").innerHTML = printed.slice(0, 20).map(order => `
    <article class="admin-order">
      <header><div><strong>${escapeHtml(order.orderId)}</strong><small>${escapeHtml(String(order.printedAt || "").replace("T", " ").slice(0, 19))}</small></div><span>${order.printCount || 1} 次</span></header>
      <p>${escapeHtml(order.customerName || "")} · ${money(order.total)}</p>
      <p class="admin-print-result">${escapeHtml(order.printResult || "")}</p>
    </article>
  `).join("") || "<p class=\"empty-state\">目前沒有列印紀錄</p>";
}

function renderPage() {
  const page = document.body.dataset.adminPage;
  if (page === "orders") renderOrdersPage();
  if (page === "stats") renderStatsPage();
  if (page === "print") renderPrintPage();
}

async function printOrder(orderId) {
  await api(`/api/orders/${encodeURIComponent(orderId)}/print`, { method: "POST", body: "{}" });
  await loadOrders();
}

document.querySelector(".admin-refresh")?.addEventListener("click", loadOrders);
document.querySelector("#pageSearch")?.addEventListener("input", renderPage);
document.querySelector("#pageStatus")?.addEventListener("change", renderPage);
document.querySelector("#pageDate")?.addEventListener("change", renderPage);
document.querySelector("#statsDate")?.addEventListener("change", renderPage);
document.querySelector("#statsRange")?.addEventListener("change", renderPage);
document.addEventListener("click", event => {
  const button = event.target.closest("[data-print-id]");
  if (button) printOrder(button.dataset.printId).catch(error => alert(error.message));
});

const statsDate = document.querySelector("#statsDate");
if (statsDate) statsDate.value = todayKey();
updateClock();
setInterval(updateClock, 1000);
loadOrders().catch(error => alert(error.message));
