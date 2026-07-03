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
    preparing: "廚房製作",
    ready: "等待取餐",
    completed: "已完成",
    rejected: "已拒單",
    cancelled: "已取消"
  };
  return labels[status] || status || "--";
}

function itemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
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

function formatDateTime(value) {
  if (!value) return "--";
  return String(value).replace("T", " ").slice(0, 19);
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
    normalizeDigits(order.customerPhone),
    order.companyName,
    order.pickupType,
    order.orderNote,
    ...(order.items || []).map(item => `${item.seriesName || item.series || ""} ${item.name || ""} ${item.quantity || ""}`)
  ].join(" ").toLowerCase();
}

function filteredOrdersForSearch() {
  const rawKeyword = document.querySelector("#pageSearch")?.value.trim() || "";
  const keyword = rawKeyword.toLowerCase();
  const digits = normalizeDigits(rawKeyword);
  const status = document.querySelector("#pageStatus")?.value || "all";
  const date = document.querySelector("#pageDate")?.value || "";

  return pageOrders.filter(order => {
    const searchable = orderSearchText(order);
    const phoneDigits = normalizeDigits(order.customerPhone);
    const orderDigits = normalizeDigits(order.orderId);
    const matchKeyword = !keyword || searchable.includes(keyword) || (digits && (phoneDigits.includes(digits) || orderDigits.includes(digits)));
    if (!matchKeyword) return false;
    if (status !== "all" && statusKey(order) !== status) return false;
    if (date && orderDate(order) !== date) return false;
    return true;
  });
}

function renderSearchHints(orders) {
  const hints = document.querySelector("#searchHints");
  if (!hints) return;
  const keyword = document.querySelector("#pageSearch")?.value.trim() || "";
  if (!keyword) {
    hints.innerHTML = "<span>可輸入手機末碼、訂單號碼、姓名、公司或餐點名稱快速查單</span>";
    return;
  }
  const top = orders.slice(0, 5).map(order => `
    <button type="button" data-open-order="${escapeHtml(order.orderId)}">
      ${escapeHtml(order.customerName || "未留姓名")} · ${escapeHtml(order.customerPhone || "未留手機")} · ${escapeHtml(order.orderId)}
    </button>
  `);
  hints.innerHTML = top.length ? top.join("") : "<span>沒有符合的訂單</span>";
}

function renderOrderSearchStats(orders) {
  const pageCount = document.querySelector("#pageCount");
  const pageRevenue = document.querySelector("#pageRevenue");
  const pageItems = document.querySelector("#pageItems");
  const pageLatest = document.querySelector("#pageLatest");
  if (pageCount) pageCount.textContent = orders.length;
  if (pageRevenue) pageRevenue.textContent = money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));
  if (pageItems) pageItems.textContent = orders.reduce((sum, order) => sum + itemCount(order), 0);
  if (pageLatest) pageLatest.textContent = orders[0] ? formatDateTime(orders[0].createdAt || orders[0].pickupTime).slice(5, 16) : "--";
}

function renderOrdersPage() {
  const orders = filteredOrdersForSearch();
  renderSearchHints(orders);
  renderOrderSearchStats(orders);

  const rows = orders.map(order => {
    const items = (order.items || []).map(item => `${item.quantity}x ${item.name}`).join("、");
    return `
      <tr class="clickable-row" data-open-order="${escapeHtml(order.orderId)}">
        <td>${escapeHtml(formatDateTime(order.pickupTime || order.createdAt).slice(0, 16))}</td>
        <td><strong>${escapeHtml(order.orderId)}</strong></td>
        <td>${escapeHtml(order.customerName || "未留姓名")}<br><small>${escapeHtml(order.companyName || "")}</small></td>
        <td><b>${escapeHtml(order.customerPhone || "未留手機")}</b></td>
        <td>${escapeHtml(items)}</td>
        <td><strong>${money(order.total)}</strong></td>
        <td><span class="table-status">${statusLabel(statusKey(order))}</span></td>
        <td>
          <button type="button" data-open-order="${escapeHtml(order.orderId)}">明細</button>
          <button type="button" data-print-id="${escapeHtml(order.orderId)}">補印</button>
        </td>
      </tr>
    `;
  });
  const table = document.querySelector("#ordersTable");
  if (table) table.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="8">沒有符合條件的訂單</td></tr>`;
}

async function openOrderDetail(orderId) {
  const order = pageOrders.find(item => item.orderId === orderId);
  if (!order) return;

  const phone = normalizeDigits(order.customerPhone);
  let customerHistory = null;
  if (phone) {
    try {
      customerHistory = await api(`/api/customers/${encodeURIComponent(phone)}/orders`);
    } catch {
      customerHistory = null;
    }
  }

  document.querySelector("#detailOrderTitle").textContent = order.orderId;
  document.querySelector("#detailStatus").textContent = statusLabel(statusKey(order));

  const items = (order.items || []).map(item => `
    <tr>
      <td>${escapeHtml(item.seriesName || item.series || "")}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${Number(item.quantity || 0)}</td>
      <td>${money(item.price)}</td>
      <td>${money(Number(item.quantity || 0) * Number(item.price || 0))}</td>
    </tr>
  `).join("");

  const timeline = (order.timeline || []).slice().reverse().map(item => `
    <li><strong>${statusLabel(item.status)}</strong><span>${escapeHtml(formatDateTime(item.at))}</span><p>${escapeHtml(item.note || "")}</p></li>
  `).join("");

  const historyOrders = customerHistory?.orders || [];
  const customer = customerHistory?.customer;
  const totalSpent = customer ? customer.totalSpent : historyOrders.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const orderCount = customer ? customer.orderCount : historyOrders.length;

  document.querySelector("#detailBody").innerHTML = `
    <section class="detail-grid">
      <article>
        <h3>客戶資料</h3>
        <dl class="detail-list">
          <div><dt>姓名</dt><dd>${escapeHtml(order.customerName || "未留")}</dd></div>
          <div><dt>手機</dt><dd>${escapeHtml(order.customerPhone || "未留")}</dd></div>
          <div><dt>公司</dt><dd>${escapeHtml(order.companyName || "未留")}</dd></div>
          <div><dt>取餐方式</dt><dd>${escapeHtml(order.pickupType || "未留")}</dd></div>
          <div><dt>取餐時間</dt><dd>${escapeHtml(formatDateTime(order.pickupTime))}</dd></div>
        </dl>
      </article>
      <article>
        <h3>客戶紀錄</h3>
        <dl class="detail-list">
          <div><dt>累計訂單</dt><dd>${orderCount}</dd></div>
          <div><dt>累計消費</dt><dd>${money(totalSpent)}</dd></div>
          <div><dt>最近下單</dt><dd>${escapeHtml(formatDateTime(customer?.lastOrderAt || historyOrders[0]?.createdAt))}</dd></div>
          <div><dt>POS狀態</dt><dd>${escapeHtml(order.posSyncStatus || "尚未同步")}</dd></div>
        </dl>
      </article>
    </section>
    <section>
      <h3>下單明細</h3>
      <div class="admin-table-wrap">
        <table class="admin-data-table detail-items-table">
          <thead><tr><th>系列</th><th>品項</th><th>數量</th><th>單價</th><th>小計</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>
      <p class="detail-total">總計 ${money(order.total)}</p>
      ${order.orderNote ? `<p class="order-note">備註：${escapeHtml(order.orderNote)}</p>` : ""}
    </section>
    <section>
      <h3>同手機點餐紀錄</h3>
      <div class="history-pills">
        ${historyOrders.length ? historyOrders.slice(0, 8).map(item => `<span>${escapeHtml(formatDateTime(item.createdAt).slice(0, 10))} · ${money(item.total)} · ${statusLabel(statusKey(item))}</span>`).join("") : "<span>目前沒有歷史紀錄</span>"}
      </div>
    </section>
    <section>
      <h3>狀態紀錄</h3>
      <ul class="detail-timeline">${timeline || "<li>目前沒有狀態紀錄</li>"}</ul>
    </section>
  `;

  const modal = document.querySelector("#orderDetailModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeOrderDetail() {
  const modal = document.querySelector("#orderDetailModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
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
  document.querySelector("#printMode").textContent = printed.some(order => String(order.printResult || "").startsWith("network:")) ? "網路出單機" : "瀏覽器列印";
  document.querySelector("#printedCountPage").textContent = printed.length;
  document.querySelector("#printJobsList").innerHTML = printed.slice(0, 20).map(order => `
    <article class="admin-order">
      <header><div><strong>${escapeHtml(order.orderId)}</strong><small>${escapeHtml(formatDateTime(order.printedAt))}</small></div><span>${order.printCount || 1} 次</span></header>
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
  const printButton = event.target.closest("[data-print-id]");
  if (printButton) {
    event.stopPropagation();
    printOrder(printButton.dataset.printId).catch(error => alert(error.message));
    return;
  }
  const detailButton = event.target.closest("[data-open-order]");
  if (detailButton) {
    openOrderDetail(detailButton.dataset.openOrder).catch(error => alert(error.message));
    return;
  }
  if (event.target.closest("[data-close-order-detail]")) closeOrderDetail();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeOrderDetail();
});

const statsDate = document.querySelector("#statsDate");
if (statsDate) statsDate.value = todayKey();
updateClock();
setInterval(updateClock, 1000);
loadOrders().catch(error => alert(error.message));
