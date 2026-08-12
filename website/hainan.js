const hainanMenu = [
  { category: "招牌雞飯", name: "白雞腿飯", price: 5.5, note: "白切雞腿、油飯、青菜" },
  { category: "招牌雞飯", name: "燒雞腿飯", price: 5.5, note: "燒雞腿、油飯、青菜" },
  { category: "招牌雞飯", name: "白雞尾飯", price: 5, note: "白切雞尾、油飯、青菜" },
  { category: "招牌雞飯", name: "燒雞尾飯", price: 5, note: "燒雞尾、油飯、青菜" },
  { category: "招牌雞飯", name: "白雞胸飯", price: 4.5, note: "白切雞胸、油飯、青菜" },
  { category: "招牌雞飯", name: "燒雞胸飯", price: 4.5, note: "燒雞胸、油飯、青菜" },
  { category: "單點雞肉", name: "白雞半隻", price: 17.5, note: "適合 2-3 人分享" },
  { category: "單點雞肉", name: "燒雞半隻", price: 17.5, note: "適合 2-3 人分享" },
  { category: "單點雞肉", name: "白雞一隻", price: 35, note: "整隻白切雞" },
  { category: "單點雞肉", name: "燒雞一隻", price: 35, note: "整隻燒雞" },
  { category: "河粉", name: "雞河粉（湯）", price: 5, note: "雞肉河粉湯" },
  { category: "河粉", name: "雞河粉（乾）", price: 5, note: "乾拌雞肉河粉" },
  { category: "小菜", name: "皮蛋豆腐", price: 5, note: "照片菜單辨識價格" },
  { category: "小菜", name: "玻璃雞腳", price: 6, note: "照片菜單辨識價格" },
  { category: "小菜", name: "芽菜", price: 4, note: "照片菜單辨識價格" },
  { category: "加點", name: "卤蛋", price: 1, note: "單顆" },
  { category: "加點", name: "油飯", price: 1, note: "加點一份" }
];

const cart = [];
const menuGrid = document.querySelector("#hainanMenuGrid");
const cartItems = document.querySelector("#hainanCartItems");
const totalEl = document.querySelector("#hainanTotal");
const submitButton = document.querySelector("#hainanSubmitOrder");
let hainanToastTimer;

function hainanMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderMenu() {
  menuGrid.innerHTML = hainanMenu.map((item, index) => `
    <article class="hainan-dish-card">
      <span>${item.category}</span>
      <h3>${item.name}</h3>
      <p>${item.note}</p>
      <div>
        <strong>${hainanMoney(item.price)}</strong>
        <button type="button" data-hainan-index="${index}">加入</button>
      </div>
    </article>
  `).join("");
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
        <strong>${item.name}</strong>
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

function addToCart(index) {
  const item = hainanMenu[index];
  const existing = cart.find(entry => entry.name === item.name);
  if (existing) existing.quantity += 1;
  else cart.push({ ...item, quantity: 1 });
  renderCart();
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
      <span>單號 ${orderId}，後台接單工作台會看到新單。</span>
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
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customer,
        source: "hainan-official",
        items: cart.map(item => ({
          series: "hainan",
          seriesName: "老王海南雞飯",
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "送出失敗");
    cart.splice(0, cart.length);
    renderCart();
    document.querySelector("#hainanCustomerName").value = "";
    document.querySelector("#hainanCustomerPhone").value = "";
    document.querySelector("#hainanOrderNote").value = "";
    showHainanToast(data.order.orderId);
  } catch (error) {
    alert(`訂單送出失敗：${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "送出訂單";
  }
}

menuGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-hainan-index]");
  if (!button) return;
  addToCart(Number(button.dataset.hainanIndex));
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
});

document.querySelector("#hainanClearCart").addEventListener("click", () => {
  cart.splice(0, cart.length);
  renderCart();
});
submitButton.addEventListener("click", submitHainanOrder);

renderMenu();
renderCart();
