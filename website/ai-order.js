let menu = [];
let addOns = [];
let cart = [];

const formatter = new Intl.NumberFormat("zh-TW");

function money(value) {
  return `$${formatter.format(Number(value || 0))}`;
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

function orderContext() {
  return {
    language: document.querySelector("#language").value,
    budget: Number(document.querySelector("#budget").value || 0),
    avoid: selectedValues("avoid"),
    allergies: selectedValues("allergy"),
    note: document.querySelector("#orderNote").value.trim()
  };
}

function setNotice(text, tone = "") {
  const notice = document.querySelector("#aiNotice");
  notice.textContent = text;
  notice.dataset.tone = tone;
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function addToCart(item, quantity = 1) {
  const existing = cart.find(line => line.id === item.id);
  if (existing) existing.quantity += quantity;
  else cart.push({
    id: item.id,
    sku: item.sku,
    name: item.name,
    series: item.kind === "addOn" ? "addon" : "ai-menu",
    seriesName: item.kind === "addOn" ? "AI 加購" : "AI 推薦",
    quantity,
    price: Number(item.price || 0),
    allergens: item.allergens || [],
    dietaryFlags: item.dietaryFlags || {}
  });
  renderCart();
  loadUpsells().catch(error => setNotice(error.message, "warn"));
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  loadUpsells().catch(console.error);
}

function menuCard(item, recommended = false) {
  const conflicts = item.conflicts?.length ? `<b class="ai-os-risk">需確認：${escapeHtml(item.conflicts.join("、"))}</b>` : "";
  const reasons = item.reasons?.length ? `<small>${escapeHtml(item.reasons.join("、"))}</small>` : "";
  const disabled = item.inventory && !item.inventory.available ? "disabled" : "";
  const image = item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : "";
  return `
    <article class="ai-os-food ${recommended ? "is-recommended" : ""}">
      ${image}
      <div class="ai-os-food-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.description || "")}</span>
        ${reasons}
        ${conflicts}
      </div>
      <div>
        <b>${money(item.price)}</b>
        <button type="button" data-add-item="${escapeHtml(item.id)}" ${disabled}>加入</button>
      </div>
    </article>
  `;
}

function renderMenu() {
  document.querySelector("#menuList").innerHTML = menu.length
    ? menu.map(item => menuCard(item)).join("")
    : `<p class="empty-state">目前沒有菜單資料</p>`;
}

function renderRecommendations(items = []) {
  document.querySelector("#recommendations").innerHTML = items.length
    ? items.map(item => menuCard(item, true)).join("")
    : `<p class="empty-state">請填寫條件後按 AI 推薦餐點</p>`;
}

function renderCart() {
  document.querySelector("#cartTotal").textContent = money(cartTotal());
  document.querySelector("#cartList").innerHTML = cart.length
    ? cart.map((item, index) => `
      <article class="ai-os-cart-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.quantity} 份 x ${money(item.price)}</span>
        </div>
        <button type="button" data-remove-index="${index}">刪除</button>
      </article>
    `).join("")
    : `<p class="empty-state">尚未加入餐點</p>`;
}

async function loadMenu() {
  const context = orderContext();
  const params = new URLSearchParams({ lang: context.language, note: context.note });
  context.avoid.forEach(value => params.append("avoid", value));
  context.allergies.forEach(value => params.append("allergy", value));
  const data = await api(`/api/restaurant-ai/menu?${params.toString()}`);
  menu = data.menu || [];
  addOns = data.addOns || [];
  renderMenu();
  setNotice(`菜單已載入，AI 模式：${data.aiProvider}`);
}

async function loadRecommendations() {
  const data = await api("/api/restaurant-ai/recommendations", {
    method: "POST",
    body: JSON.stringify(orderContext())
  });
  renderRecommendations(data.recommendations || []);
  setNotice(data.dietaryNote?.kitchenNote || "已依條件產生推薦");
}

async function loadUpsells() {
  if (!cart.length) {
    document.querySelector("#upsells").innerHTML = "";
    return;
  }
  const data = await api("/api/restaurant-ai/upsells", {
    method: "POST",
    body: JSON.stringify({ ...orderContext(), items: cart })
  });
  document.querySelector("#upsells").innerHTML = (data.upsells || []).length
    ? `<div class="ai-os-divider"></div><h3>AI 加購推薦</h3>${data.upsells.map(item => menuCard(item, true)).join("")}`
    : "";
}

async function submitOrder() {
  if (!cart.length) {
    alert("請先加入餐點。");
    return;
  }
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  const context = orderContext();
  const dietaryNote = await api("/api/restaurant-ai/dietary-note", {
    method: "POST",
    body: JSON.stringify(context)
  });
  const order = {
    source: "ai-qr",
    tableCode: document.querySelector("#tableCode").value.trim(),
    language: context.language,
    customerName: document.querySelector("#customerName").value.trim() || "現場客",
    customerPhone: document.querySelector("#customerPhone").value.trim() || `table-${document.querySelector("#tableCode").value.trim()}`,
    companyName: "AI 掃碼點餐",
    pickupType: document.querySelector("#pickupType").value,
    pickupTime: now.toISOString().slice(0, 16),
    orderNote: dietaryNote.kitchenNote,
    dietaryNote,
    items: cart,
    total: cartTotal()
  };
  const button = document.querySelector("#submitOrderButton");
  button.disabled = true;
  button.textContent = "送出中...";
  try {
    const data = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify(order)
    });
    setNotice(`訂單 ${data.order.orderId} 已送到前台與後廚`, "ok");
    cart = [];
    renderCart();
    await loadUpsells();
  } catch (error) {
    setNotice(`送單失敗：${error.message}`, "warn");
  } finally {
    button.disabled = false;
    button.textContent = "送出到前台";
  }
}

function findDisplayItem(id) {
  return [...menu, ...addOns].find(item => item.id === id);
}

document.querySelector("#recommendButton").addEventListener("click", () => loadRecommendations().catch(error => setNotice(error.message, "warn")));
document.querySelector("#reloadMenuButton").addEventListener("click", () => loadMenu().catch(error => setNotice(error.message, "warn")));
document.querySelector("#clearCartButton").addEventListener("click", () => {
  cart = [];
  renderCart();
  loadUpsells().catch(console.error);
});
document.querySelector("#submitOrderButton").addEventListener("click", submitOrder);
document.querySelector("#tableCode").addEventListener("input", event => {
  document.querySelector("#qrHint").textContent = event.target.value || "TABLE";
});
document.body.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-item]");
  const removeButton = event.target.closest("[data-remove-index]");
  if (addButton) {
    const item = findDisplayItem(addButton.dataset.addItem);
    if (item) addToCart(item);
  }
  if (removeButton) removeFromCart(Number(removeButton.dataset.removeIndex));
});
document.querySelector("#language").addEventListener("change", () => loadMenu().catch(error => setNotice(error.message, "warn")));

loadMenu().catch(error => setNotice(error.message, "warn"));
renderCart();
