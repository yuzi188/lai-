const catalogs = {
  healthy: {
    series: "健康輕食系列",
    cta: "查看營養指標",
    dishes: [
      {
        no: "01",
        name: "舒肥雞胸健康餐",
        tag: "人氣推薦",
        image: "assets/menu/chicken-breast.jpg",
        price: "NT$120-140",
        subtitle: "舒肥雞胸 180g + 五穀飯 + 固定配菜 + 糖心蛋",
        nutrition: { 熱量: "645 kcal", 蛋白質: "55 g", 碳水化合物: "48 g", 脂肪: "21 g", 膳食纖維: "8 g", 鈉: "650 mg" },
        ingredients: ["舒肥雞胸 180g = 約 297 kcal", "五穀飯 150g = 約 180 kcal", "固定配菜 200g = 約 123 kcal", "糖心蛋 55g = 約 77 kcal"]
      },
      {
        no: "02",
        name: "香煎雞腿排健康餐",
        tag: "經典美味",
        image: "assets/menu/chicken-thigh.jpg",
        price: "NT$130-150",
        subtitle: "去骨雞腿排 200g + 五穀飯 + 固定配菜 + 糖心蛋",
        nutrition: { 熱量: "705 kcal", 蛋白質: "48 g", 碳水化合物: "50 g", 脂肪: "28 g", 膳食纖維: "8 g", 鈉: "720 mg" },
        ingredients: ["去骨雞腿排 200g = 約 440 kcal", "五穀飯 150g = 約 180 kcal", "固定配菜 200g = 約 123 kcal", "糖心蛋 55g = 約 77 kcal"]
      },
      {
        no: "03",
        name: "黑胡椒豬里肌健康餐",
        tag: "低脂推薦",
        image: "assets/menu/pork-loin.jpg",
        price: "NT$120-140",
        subtitle: "厚切豬里肌 180g + 五穀飯 + 固定配菜 + 糖心蛋",
        nutrition: { 熱量: "660 kcal", 蛋白質: "49 g", 碳水化合物: "47 g", 脂肪: "22 g", 膳食纖維: "8 g", 鈉: "680 mg" },
        ingredients: ["豬里肌 180g = 約 333 kcal", "五穀飯 150g = 約 180 kcal", "固定配菜 200g = 約 123 kcal", "糖心蛋 55g = 約 77 kcal"]
      },
      {
        no: "04",
        name: "蒜香嫩肩牛健康餐",
        tag: "高蛋白首選",
        image: "assets/menu/beef-shoulder.jpg",
        price: "NT$150-180",
        subtitle: "嫩肩牛肉 150g + 五穀飯 + 固定配菜 + 糖心蛋",
        nutrition: { 熱量: "715 kcal", 蛋白質: "52 g", 碳水化合物: "49 g", 脂肪: "27 g", 膳食纖維: "8 g", 鈉: "690 mg" },
        ingredients: ["嫩肩牛肉 150g = 約 353 kcal", "五穀飯 150g = 約 180 kcal", "固定配菜 200g = 約 123 kcal", "糖心蛋 55g = 約 77 kcal"]
      },
      {
        no: "05",
        name: "香煎鮭魚健康餐",
        tag: "Omega-3 補給",
        image: "assets/menu/salmon.jpg",
        price: "NT$180-200",
        subtitle: "鮭魚排 150g + 五穀飯 + 固定配菜 + 糖心蛋",
        nutrition: { 熱量: "690 kcal", 蛋白質: "46 g", 碳水化合物: "49 g", 脂肪: "26 g", 膳食纖維: "8 g", 鈉: "650 mg" },
        ingredients: ["鮭魚排 150g = 約 336 kcal", "五穀飯 150g = 約 180 kcal", "固定配菜 200g = 約 123 kcal", "糖心蛋 55g = 約 77 kcal"]
      }
    ]
  },
  classic: {
    series: "經典台味系列",
    cta: "查看營養與配菜",
    dishes: [
      {
        no: "01",
        name: "招牌控肉便當",
        tag: "肥而不膩",
        image: "assets/classic/braised-pork.jpg",
        price: "NT$120",
        subtitle: "控肉 160g + 白飯 + 筍乾配菜 + 糖心蛋 + 味噌湯",
        nutrition: { 熱量: "781 kcal", 蛋白質: "31.2 g", 碳水化合物: "98.8 g", 脂肪: "32.1 g", 膳食纖維: "4.6 g", 鈉: "1120 mg" },
        ingredients: ["控肉 160g = 約 512 kcal", "白飯 180g = 約 234 kcal", "筍乾配菜 160g = 約 110 kcal", "糖心蛋 55g = 約 77 kcal", "味噌湯 250ml = 約 45 kcal"]
      },
      {
        no: "02",
        name: "川味口水雞便當",
        tag: "麻香開胃",
        image: "assets/classic/saliva-chicken.jpg",
        price: "NT$120",
        subtitle: "口水雞 170g + 白飯 + 筍乾配菜 + 糖心蛋 + 味噌湯",
        nutrition: { 熱量: "721 kcal", 蛋白質: "40.8 g", 碳水化合物: "95.2 g", 脂肪: "18.6 g", 膳食纖維: "4.3 g", 鈉: "1085 mg" },
        ingredients: ["口水雞 170g = 約 349 kcal", "白飯 180g = 約 234 kcal", "筍乾配菜 160g = 約 110 kcal", "糖心蛋 55g = 約 77 kcal", "味噌湯 250ml = 約 45 kcal"]
      },
      {
        no: "03",
        name: "古早味滷排骨便當",
        tag: "肉質軟嫩",
        image: "assets/classic/pork-rib.jpg",
        price: "NT$120",
        subtitle: "滷排骨 170g + 白飯 + 筍乾配菜 + 糖心蛋 + 味噌湯",
        nutrition: { 熱量: "798 kcal", 蛋白質: "33.5 g", 碳水化合物: "96.6 g", 脂肪: "34.4 g", 膳食纖維: "4.6 g", 鈉: "1150 mg" },
        ingredients: ["滷排骨 170g = 約 519 kcal", "白飯 180g = 約 234 kcal", "筍乾配菜 160g = 約 110 kcal", "糖心蛋 55g = 約 77 kcal", "味噌湯 250ml = 約 45 kcal"]
      },
      {
        no: "04",
        name: "鹽烤鯖魚便當",
        tag: "鮮美營養",
        image: "assets/classic/mackerel.jpg",
        price: "NT$120",
        subtitle: "鯖魚 150g + 白飯 + 筍乾配菜 + 糖心蛋 + 味噌湯",
        nutrition: { 熱量: "688 kcal", 蛋白質: "32.2 g", 碳水化合物: "93.1 g", 脂肪: "19.6 g", 膳食纖維: "4.2 g", 鈉: "1010 mg" },
        ingredients: ["鯖魚 150g = 約 308 kcal", "白飯 180g = 約 234 kcal", "筍乾配菜 160g = 約 110 kcal", "糖心蛋 55g = 約 77 kcal", "味噌湯 250ml = 約 45 kcal"]
      }
    ]
  }
};

const pageKey = document.body.dataset.catalog;
const catalog = catalogs[pageKey];
const grid = document.querySelector("#dishGrid");
const modal = document.querySelector("#dishModal");

function renderDishCards() {
  grid.innerHTML = catalog.dishes.map((dish, index) => `
    <article class="dish-display-card">
      <button class="dish-image-button" type="button" data-dish-index="${index}" aria-label="查看 ${dish.name} 營養資訊">
        <img src="${dish.image}" alt="${dish.name}" loading="lazy">
        <span>${dish.no}</span>
      </button>
      <div class="dish-card-body">
        <div>
          <p>${dish.tag}</p>
          <h2>${dish.name}</h2>
        </div>
        <strong>${dish.price}</strong>
        <p>${dish.subtitle}</p>
        <button type="button" data-dish-index="${index}">${catalog.cta}</button>
      </div>
    </article>
  `).join("");
}

function openDishModal(index) {
  const dish = catalog.dishes[index];
  document.querySelector("#dishModalImage").src = dish.image;
  document.querySelector("#dishModalImage").alt = dish.name;
  document.querySelector("#dishModalSeries").textContent = catalog.series;
  document.querySelector("#dishModalTitle").textContent = dish.name;
  document.querySelector("#dishModalSubtitle").textContent = dish.subtitle;
  document.querySelector("#dishModalNutrition").innerHTML = Object.entries(dish.nutrition).map(([label, value]) => `
    <div><span>${label}</span><strong>${value}</strong></div>
  `).join("");
  document.querySelector("#dishModalIngredients").innerHTML = dish.ingredients.map(item => `<li>${item}</li>`).join("");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDishModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-dish-index]");
  if (!button) return;
  openDishModal(Number(button.dataset.dishIndex));
});

modal.addEventListener("click", event => {
  if (event.target.closest("[data-close-modal]")) closeDishModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeDishModal();
});

renderDishCards();
