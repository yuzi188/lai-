let hainanMenu = [];
let hainanAddOns = [];
const cart = [];
const menuGrid = document.querySelector("#hainanMenuGrid");
const cartItems = document.querySelector("#hainanCartItems");
const totalEl = document.querySelector("#hainanTotal");
const submitButton = document.querySelector("#hainanSubmitOrder");
const params = new URLSearchParams(window.location.search);
const restaurantContext = {
  storeId: params.get("storeId") || "hainan-singapore",
  source: params.get("source") || "hainan-official",
  bot: params.get("bot") || ""
};
const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;

window.Telegram?.WebApp?.ready?.();
let hainanToastTimer;

function hainanMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
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
  if (!response.ok) throw new Error(data.error || data.reason || "API error");
  return data;
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function hainanContext() {
  return {
    language: document.querySelector("#hainanLanguage")?.value || "zh-TW",
    budget: Number(document.querySelector("#hainanBudget")?.value || 0),
    avoid: selectedValues("hainanAvoid"),
    allergies: selectedValues("hainanAllergy"),
    note: document.querySelector("#hainanOrderNote").value.trim()
  };
}

function setAiNotice(text, tone = "") {
  const notice = document.querySelector("#hainanAiNotice");
  if (!notice) return;
  notice.textContent = text;
  notice.dataset.tone = tone;
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function dishCard(item, recommended = false) {
  const conflicts = item.conflicts?.length ? `<b class="hainan-risk">需確認：${escapeHtml(item.conflicts.join("、"))}</b>` : "";
  const reasons = item.reasons?.length ? `<small>${escapeHtml(item.reasons.join("、"))}</small>` : "";
  const disabled = item.inventory && !item.inventory.available ? "disabled" : "";
  return `
    <article class="hainan-dish-card ${recommended ? "hainan-recommended" : ""}">
      <span>${escapeHtml(item.category || "AI MENU")}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description || "")}</p>
      ${reasons}
      ${conflicts}
      <div>
        <strong>${hainanMoney(item.price)}</strong>
        <button type="button" data-hainan-id="${escapeHtml(item.id)}" ${disabled}>加入</button>
      </div>
    </article>
  `;
}

function renderMenu() {
  menuGrid.innerHTML = hainanMenu.length
    ? hainanMenu.map(item => dishCard(item)).join("")
    : `<p>目前沒有菜單資料</p>`;
}

function renderRecommendations(items = []) {
  const target = document.querySelector("#hainanRecommendations");
  target.innerHTML = items.length
    ? items.map(item => dishCard(item, true)).join("")
    : `<p>填寫偏好後按 AI 推薦。</p>`;
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = "<p>尚未加入餐點</p>";
    totalEl.textContent = "$0";
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <article class="hainan-cart-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${hainanMoney(item.price)} / 份</span>
      </div>
      <div class="hainan-qty">
        <button type="button" data-cart-action="minus" data-cart-index="${index}">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-cart-action="plus" data-cart-index="${index}">+</button>
      </div>
      <button type="button" class="hainan-remove" data-cart-action="remove" data-cart-index="${index}">刪除</button>
    </article>
  `).join("");
  totalEl.textContent = hainanMoney(cartTotal());
}

function addToCart(item) {
  const existing = cart.find(entry => entry.id === item.id);
  if (existing) existing.quantity += 1;
  else cart.push({
    id: item.id,
    sku: item.sku,
    series: "hainan",
    seriesName: "老王海南雞飯",
    name: item.name,
    quantity: 1,
    price: Number(item.price || 0),
    allergens: item.allergens || [],
    dietaryFlags: item.dietaryFlags || {}
  });
  renderCart();
  loadUpsells().catch(error => setAiNotice(error.message, "warn"));
}

function findItem(id) {
  return [...hainanMenu, ...hainanAddOns].find(item => item.id === id);
}

async function loadMenu() {
  const context = hainanContext();
  const query = new URLSearchParams({ lang: context.language, note: context.note });
  context.avoid.forEach(value => query.append("avoid", value));
  context.allergies.forEach(value => query.append("allergy", value));
  const data = await api(`/api/restaurant-ai/menu?${query.toString()}`);
  hainanMenu = data.menu || [];
  hainanAddOns = data.addOns || [];
  renderMenu();
  setAiNotice(`${data.language} 菜單已載入：${hainanMenu.length} 個主餐、${hainanAddOns.length} 個加購。`);
}

async function loadRecommendations() {
  const data = await api("/api/restaurant-ai/recommendations", {
    method: "POST",
    body: JSON.stringify(hainanContext())
  });
  renderRecommendations(data.recommendations || []);
  setAiNotice(data.dietaryNote?.kitchenNote || "AI 已依偏好推薦。");
}

async function loadUpsells() {
  const target = document.querySelector("#hainanUpsells");
  if (!cart.length) {
    target.innerHTML = "";
    return;
  }
  const data = await api("/api/restaurant-ai/upsells", {
    method: "POST",
    body: JSON.stringify({ ...hainanContext(), items: cart })
  });
  target.innerHTML = (data.upsells || []).length
    ? `<h3>AI 加購推薦</h3>${data.upsells.map(item => dishCard(item, true)).join("")}`
    : "";
}

function readCustomer() {
  return {
    customerName: document.querySelector("#hainanCustomerName").value.trim(),
    customerPhone: document.querySelector("#hainanCustomerPhone").value.trim(),
    companyName: "老王新加坡海南雞飯",
    pickupType: document.querySelector("#hainanPickupType").value,
    pickupTime: document.querySelector("#hainanPickupTime").value,
    orderNote: document.querySelector("#hainanOrderNote").value.trim()
  };
}

function showHainanToast(orderId) {
  window.clearTimeout(hainanToastTimer);
  document.querySelector(".order-success-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "order-success-toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <div>
      <strong>訂單已送出</strong>
      <span>單號 ${orderId}，後台與 AI 後廚會看到新單。</span>
    </div>
  `;
  document.body.appendChild(toast);
  hainanToastTimer = window.setTimeout(() => toast.remove(), 4800);
}

async function submitHainanOrder() {
  const customer = readCustomer();
  if (!customer.customerName || !customer.customerPhone || !customer.pickupTime || !cart.length) {
    alert("請填寫姓名、電話、取餐時間，並至少加入一個餐點。");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "送出中...";
  try {
    const dietaryNote = await api("/api/restaurant-ai/dietary-note", {
      method: "POST",
      body: JSON.stringify(hainanContext())
    });
    const response = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        ...customer,
        ...restaurantContext,
        source: restaurantContext.source === "telegram" ? "telegram-lai999-bot" : restaurantContext.source,
        botUsername: restaurantContext.bot || undefined,
        telegramUserId: telegramUser?.id ? String(telegramUser.id) : undefined,
        telegramChatId: telegramUser?.id ? String(telegramUser.id) : undefined,
        telegramUsername: telegramUser?.username || undefined,
        tableCode: document.querySelector("#hainanTableCode").value.trim(),
        language: hainanContext().language,
        orderNote: dietaryNote.kitchenNote,
        dietaryNote,
        items: cart.map(item => ({
          id: item.id,
          sku: item.sku,
          series: item.series,
          seriesName: item.seriesName,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          allergens: item.allergens,
          dietaryFlags: item.dietaryFlags
        }))
      })
    });
    cart.splice(0, cart.length);
    renderCart();
    await loadUpsells();
    document.querySelector("#hainanCustomerName").value = "";
    document.querySelector("#hainanCustomerPhone").value = "";
    document.querySelector("#hainanOrderNote").value = "";
    showHainanToast(response.order.orderId);
  } catch (error) {
    alert(`訂單送出失敗：${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "送出訂單";
  }
}

menuGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-hainan-id]");
  if (!button) return;
  const item = findItem(button.dataset.hainanId);
  if (item) addToCart(item);
});

document.querySelector("#hainanRecommendations").addEventListener("click", event => {
  const button = event.target.closest("[data-hainan-id]");
  if (!button) return;
  const item = findItem(button.dataset.hainanId);
  if (item) addToCart(item);
});

document.querySelector("#hainanUpsells").addEventListener("click", event => {
  const button = event.target.closest("[data-hainan-id]");
  if (!button) return;
  const item = findItem(button.dataset.hainanId);
  if (item) addToCart(item);
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const index = Number(button.dataset.cartIndex);
  const action = button.dataset.cartAction;
  if (action === "plus") cart[index].quantity += 1;
  if (action === "minus") cart[index].quantity -= 1;
  if (action === "remove" || cart[index]?.quantity <= 0) cart.splice(index, 1);
  renderCart();
  loadUpsells().catch(console.error);
});

document.querySelector("#hainanClearCart").addEventListener("click", () => {
  cart.splice(0, cart.length);
  renderCart();
  loadUpsells().catch(console.error);
});
document.querySelector("#hainanSubmitOrder").addEventListener("click", submitHainanOrder);
document.querySelector("#hainanRecommend").addEventListener("click", () => loadRecommendations().catch(error => setAiNotice(error.message, "warn")));
document.querySelector("#hainanReloadMenu").addEventListener("click", () => loadMenu().catch(error => setAiNotice(error.message, "warn")));
document.querySelector("#hainanLanguage").addEventListener("change", () => loadMenu().catch(error => setAiNotice(error.message, "warn")));

loadMenu().catch(error => setAiNotice(error.message, "warn"));
renderCart();
