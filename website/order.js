const menuItems = {
  healthy: [
    { name: "舒肥雞胸健康餐", price: 140 },
    { name: "香煎雞腿排健康餐", price: 150 },
    { name: "黑胡椒豬里肌健康餐", price: 140 },
    { name: "蒜香嫩肩牛健康餐", price: 180 },
    { name: "香煎鮭魚健康餐", price: 200 }
  ],
  classic: [
    { name: "招牌控肉便當", price: 120 },
    { name: "川味口水雞便當", price: 120 },
    { name: "古早味滷排骨便當", price: 120 },
    { name: "鹽烤鯖魚便當", price: 120 }
  ]
};

const seriesNames = {
  healthy: "健康輕食",
  classic: "經典台味"
};

let currentItems = [];

const seriesSelect = document.querySelector("#seriesSelect");
const itemSelect = document.querySelector("#itemSelect");
const quantityInput = document.querySelector("#quantityInput");
const priceInput = document.querySelector("#priceInput");
const orderItemsBody = document.querySelector("#orderItemsBody");
const orderTotal = document.querySelector("#orderTotal");
const saveButton = document.querySelector("#saveButton");

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function updateItemOptions() {
  const items = menuItems[seriesSelect.value];
  itemSelect.innerHTML = items.map((item, index) => `<option value="${index}">${item.name}</option>`).join("");
  priceInput.value = items[0].price;
}

function getCustomerInfo() {
  return {
    customerName: document.querySelector("#customerName").value.trim(),
    customerPhone: document.querySelector("#customerPhone").value.trim(),
    companyName: document.querySelector("#companyName").value.trim(),
    pickupType: document.querySelector("#pickupType").value,
    pickupTime: document.querySelector("#pickupTime").value,
    orderNote: document.querySelector("#orderNote").value.trim()
  };
}

function getTotal() {
  return currentItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

function renderItems() {
  if (!currentItems.length) {
    orderItemsBody.innerHTML = `<tr><td colspan="6">尚未加入品項</td></tr>`;
    orderTotal.textContent = "$0";
    return;
  }

  orderItemsBody.innerHTML = currentItems.map((item, index) => `
    <tr>
      <td>${item.seriesName}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatMoney(item.price)}</td>
      <td>${formatMoney(item.quantity * item.price)}</td>
      <td><button type="button" class="mini-remove" data-index="${index}">刪除</button></td>
    </tr>
  `).join("");
  orderTotal.textContent = formatMoney(getTotal());
}

function addItem() {
  const series = seriesSelect.value;
  const menuItem = menuItems[series][Number(itemSelect.value)];
  const quantity = Math.max(1, Number(quantityInput.value || 1));
  const price = Math.max(0, Number(priceInput.value || menuItem.price));

  currentItems.push({
    series,
    seriesName: seriesNames[series],
    name: menuItem.name,
    quantity,
    price
  });
  renderItems();
}

function resetOrderForm() {
  currentItems = [];
  document.querySelector("#orderForm").reset();
  updateItemOptions();
  renderItems();
}

async function saveOrder() {
  const info = getCustomerInfo();
  if (!info.customerName || !info.customerPhone || !info.pickupTime || !currentItems.length) {
    alert("請填寫姓名、電話、取餐時間，並至少加入一個品項。");
    return;
  }

  const order = {
    ...info,
    items: currentItems,
    total: getTotal()
  };

  saveButton.disabled = true;
  saveButton.textContent = "送出中...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "送出失敗");
    alert(`訂單已送出，後台會看到新單：${data.order.orderId}`);
    resetOrderForm();
  } catch (error) {
    alert(`訂單送出失敗：${error.message}`);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "送出訂單";
  }
}

seriesSelect.addEventListener("change", updateItemOptions);
itemSelect.addEventListener("change", () => {
  const item = menuItems[seriesSelect.value][Number(itemSelect.value)];
  priceInput.value = item.price;
});

document.querySelector("#addItemButton").addEventListener("click", addItem);
document.querySelector("#clearButton").addEventListener("click", () => {
  currentItems = [];
  renderItems();
});
saveButton.addEventListener("click", saveOrder);
orderItemsBody.addEventListener("click", event => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  currentItems.splice(Number(button.dataset.index), 1);
  renderItems();
});

updateItemOptions();
renderItems();
