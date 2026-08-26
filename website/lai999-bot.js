const botParams = new URLSearchParams(window.location.search);
const botContext = {
  storeId: botParams.get("storeId") || "hainan-singapore",
  source: botParams.get("source") || "telegram",
  bot: botParams.get("bot") || "Lai999_BOT"
};

window.Telegram?.WebApp?.ready?.();
window.Telegram?.WebApp?.expand?.();

async function botApi(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

function botEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function botMoney(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function statusLabel(status) {
  return {
    pending: "已收到",
    preparing: "製作中",
    accepted: "製作中",
    ready: "可取餐",
    completed: "已完成",
    rejected: "已拒單",
    cancelled: "已取消"
  }[status] || status || "未知";
}

function pageUrl(pathname, instance) {
  const url = new URL(pathname, window.location.origin);
  url.searchParams.set("storeId", instance.id || botContext.storeId);
  url.searchParams.set("source", botContext.source);
  url.searchParams.set("bot", botContext.bot);
  return url.toString();
}

function setLink(selector, href) {
  const element = document.querySelector(selector);
  if (element) element.href = href;
}

function renderInstance(instance) {
  const orderUrl = pageUrl(instance.orderPath || "/hainan.html", instance);
  const kitchenUrl = pageUrl(instance.kitchenPath || "/ai-kitchen.html", instance);
  const managerUrl = pageUrl(instance.managerPath || "/ai-manager.html", instance);
  const serviceLines = [
    `電話：${instance.phone || "尚未設定"}`,
    `營業：${(instance.hours || []).join(" / ") || "尚未設定"}`,
    `付款：${(instance.payment || []).join("、") || "以店內公告為準"}`
  ];

  document.title = `${instance.shortName || instance.name || "餐廳"}｜Lai999 BOT`;
  document.querySelector(".lai999-hero h1").textContent = `${instance.name || "餐廳"} AI 功能頁`;
  document.querySelector("#serviceInfo").textContent = serviceLines.join("\n");
  document.querySelector("#locationInfo").textContent = instance.address || "店址尚未設定";
  setLink("#orderLink", orderUrl);
  setLink("#orderLinkCard", orderUrl);
  setLink("#kitchenLink", `${kitchenUrl}&role=kitchen`);
  setLink("#managerLink", `${managerUrl}&role=manager`);
  setLink("#mapLink", instance.mapUrl || "#");
  setLink("#mapLinkCard", instance.mapUrl || "#");
  document.querySelector("#copyServiceText").dataset.text = [
    instance.name || "餐廳",
    ...serviceLines,
    `地址：${instance.address || "尚未設定"}`
  ].join("\n");
}

async function loadInstance() {
  const data = await botApi("/api/telegram/lai999/instance");
  renderInstance(data.instance || {});
}

function renderOrders(orders = []) {
  if (!orders.length) return "查不到這支電話的訂單。";
  return orders.slice(0, 5).map(order => {
    const items = (order.items || []).map(item => `${botEscape(item.name)} x${Number(item.quantity || 0)}`).join("、");
    return `
      <article class="lai999-order-row">
        <strong>${botEscape(order.orderId)}</strong>
        <span>${botEscape(statusLabel(order.status))}</span>
        <small>${botEscape(items || "未列餐點")}</small>
        <b>${botMoney(order.total)}</b>
      </article>
    `;
  }).join("");
}

async function lookupOrders(event) {
  event.preventDefault();
  const phone = document.querySelector("#lookupPhone").value.trim();
  const target = document.querySelector("#lookupResult");
  if (!phone) {
    target.textContent = "請先輸入下單電話。";
    return;
  }
  target.textContent = "查詢中...";
  try {
    const data = await botApi(`/api/customers/${encodeURIComponent(phone)}/orders`);
    target.innerHTML = renderOrders(data.orders || []);
  } catch (error) {
    target.textContent = error.message;
  }
}

async function submitFeedback(event) {
  event.preventDefault();
  const text = document.querySelector("#feedbackTextBot").value.trim();
  const target = document.querySelector("#feedbackResultBot");
  if (!text) {
    target.textContent = "請先輸入回饋內容。";
    return;
  }
  target.textContent = "送出中...";
  try {
    await botApi("/api/restaurant-ai/feedback/summary", {
      method: "POST",
      body: JSON.stringify({
        persist: true,
        feedback: [{
          channel: "telegram-lai999-bot",
          type: document.querySelector("#feedbackTypeBot").value,
          rating: document.querySelector("#feedbackTypeBot").value === "praise" ? 5 : 2,
          text
        }]
      })
    });
    document.querySelector("#feedbackTextBot").value = "";
    target.textContent = "已送出，老闆面板會同步看到 AI 摘要。";
  } catch (error) {
    target.textContent = error.message;
  }
}

document.querySelector("#copyServiceText").addEventListener("click", async event => {
  const text = event.currentTarget.dataset.text || "";
  try {
    await navigator.clipboard.writeText(text);
    event.currentTarget.textContent = "已複製";
  } catch {
    event.currentTarget.textContent = "複製失敗";
  }
  window.setTimeout(() => {
    event.currentTarget.textContent = "複製客服資訊";
  }, 1600);
});

document.querySelector("#orderLookupForm").addEventListener("submit", lookupOrders);
document.querySelector("#feedbackFormBot").addEventListener("submit", submitFeedback);
loadInstance().catch(error => {
  document.querySelector("#serviceInfo").textContent = error.message;
});
