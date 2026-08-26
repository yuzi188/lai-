function money(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
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

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function renderTopItems(items = []) {
  document.querySelector("#topItems").innerHTML = items.length
    ? items.map(item => `
      <div class="item-stat-row">
        <span>${escapeHtml(item.name)}</span>
        <strong>${Number(item.quantity || 0)} 份</strong>
        <b>${money(item.revenue)}</b>
      </div>
    `).join("")
    : `<p class="empty-state">今日尚無銷售資料</p>`;
}

function renderInventory(items = []) {
  document.querySelector("#lowStockCount").textContent = items.length;
  document.querySelector("#inventoryList").innerHTML = items.length
    ? items.map(item => `
      <div class="item-stat-row ai-os-inventory-row">
        <span>${escapeHtml(item.name)}：剩 ${item.onHand} ${escapeHtml(item.unit)}</span>
        <strong>${escapeHtml(item.status)}</strong>
        <b>${escapeHtml(item.advice)}</b>
      </div>
    `).join("")
    : `<p class="empty-state">庫存目前正常</p>`;
}

function renderFeedback(feedback) {
  document.querySelector("#feedbackCount").textContent = feedback.count || 0;
  const themes = (feedback.themes || []).map(theme => `<span>${escapeHtml(theme.label)} ${theme.count}</span>`).join("");
  const actions = (feedback.actionItems || []).map(item => `
    <li>
      <strong>${escapeHtml(item.channel || "manual")}</strong>
      <span>${escapeHtml(item.text)}</span>
      <small>${escapeHtml(item.suggestion)}</small>
    </li>
  `).join("");
  document.querySelector("#feedbackSummary").innerHTML = `
    <p>${escapeHtml(feedback.summary || "目前沒有摘要")}</p>
    <div class="ai-os-theme-row">${themes || "<span>尚無主題</span>"}</div>
    <ul>${actions || "<li><span>沒有待處理客訴</span></li>"}</ul>
  `;
}

function renderBrief(lines = []) {
  document.querySelector("#aiBrief").innerHTML = lines.length
    ? lines.map(line => `<article>${escapeHtml(line)}</article>`).join("")
    : `<article>目前沒有 AI 建議。</article>`;
}

async function loadReport() {
  const date = document.querySelector("#reportDate").value || todayKey();
  const report = await api(`/api/restaurant-ai/reports/daily?date=${encodeURIComponent(date)}`);
  document.querySelector("#revenue").textContent = money(report.sales?.revenue);
  document.querySelector("#orderCount").textContent = report.orders?.count || 0;
  document.querySelector("#aov").textContent = money(report.sales?.averageOrderValue);
  document.querySelector("#grossProfit").textContent = money(report.sales?.grossProfit);
  document.querySelector("#marginRate").textContent = percent(report.sales?.marginRate);
  renderBrief(report.aiBrief || []);
  renderTopItems(report.sales?.topItems || []);
  renderInventory(report.inventory?.lowStock || []);
  renderFeedback(report.feedback || {});
}

async function submitFeedback(event) {
  event.preventDefault();
  const text = document.querySelector("#feedbackText").value.trim();
  if (!text) return;
  await api("/api/restaurant-ai/feedback/summary", {
    method: "POST",
    body: JSON.stringify({
      persist: true,
      feedback: [{
        type: document.querySelector("#feedbackType").value,
        rating: Number(document.querySelector("#feedbackRating").value || 0),
        text
      }]
    })
  });
  document.querySelector("#feedbackText").value = "";
  await loadReport();
}

document.querySelector("#reportDate").value = todayKey();
document.querySelector("#refreshReportButton").addEventListener("click", () => loadReport().catch(error => alert(error.message)));
document.querySelector("#feedbackForm").addEventListener("submit", event => submitFeedback(event).catch(error => alert(error.message)));
loadReport().catch(error => alert(error.message));
