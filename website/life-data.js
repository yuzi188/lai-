window.LAI_LIFE_DATA = {
  member: {
    name: "Yu Zi",
    level: 27,
    title: "便當王",
    vip: "Gold VIP",
    exp: 1280,
    nextExp: 2500,
    streak: 15,
    eaten: 126,
    giftsSent: 38,
    friends: 72
  },
  wallet: {
    coins: 12680,
    tickets: 38,
    hearts: 5,
    maxHearts: 5
  },
  tasks: [
    { id: "buy", label: "購買 1 份便當", reward: "+30 點", done: true },
    { id: "share", label: "分享便當照片", reward: "+20 點", done: false },
    { id: "gift", label: "送禮給好友", reward: "+20 點", done: false },
    { id: "invite", label: "邀請好友", reward: "+100 點", done: false }
  ],
  signIn: {
    signed: false,
    streak: 15,
    todayReward: "+20 點",
    week: [
      { day: 1, reward: "10 點", claimed: true },
      { day: 2, reward: "滷蛋券", claimed: true },
      { day: 3, reward: "20 點", claimed: true },
      { day: 4, reward: "飲料券", claimed: false },
      { day: 5, reward: "30 點", claimed: false },
      { day: 6, reward: "加菜券", claimed: false },
      { day: 7, reward: "神秘便當券", claimed: false }
    ]
  },
  rankings: {
    bento: [
      ["Kevin", "1280 份"], ["Amy", "952 份"], ["James", "846 份"], ["Yu Zi", "728 份"], ["Hana", "610 份"]
    ],
    gift: [["Mina", "88 次"], ["Kevin", "76 次"], ["Yu Zi", "38 次"]],
    invite: [["Amy", "42 人"], ["Ray", "31 人"], ["Yu Zi", "18 人"]],
    healthy: [["Leo", "21 天"], ["Yu Zi", "16 天"], ["Annie", "12 天"]],
    checkin: [["Yu Zi", "15 天"], ["Kevin", "13 天"], ["Hana", "11 天"]],
    share: [["Nora", "62 篇"], ["Yu Zi", "37 篇"], ["James", "31 篇"]]
  },
  friends: [
    { name: "王小明", status: "在線", lastMeal: "雞腿便當", note: "5 分鐘前" },
    { name: "Amy", status: "吃飯中", lastMeal: "舒肥雞胸", note: "北屯店" },
    { name: "Kevin", status: "離線", lastMeal: "控肉便當", note: "今天 12:10" },
    { name: "Hana", status: "在線", lastMeal: "香煎鮭魚", note: "剛剛打卡" }
  ],
  gifts: [
    { name: "滷蛋券", cost: 3, stock: 8 },
    { name: "飲料券", cost: 5, stock: 5 },
    { name: "雞腿升級券", cost: 12, stock: 2 },
    { name: "10 元折價券", cost: 10, stock: 20 },
    { name: "50 點數禮包", cost: 0, stock: 1 }
  ],
  coupons: [
    { name: "雞腿升級券", status: "可使用", expiry: "2026/07/31", rule: "經典台味滿 120 可用" },
    { name: "滷蛋券", status: "可使用", expiry: "2026/07/20", rule: "任一便當可加兌" },
    { name: "飲料券", status: "已使用", expiry: "2026/07/12", rule: "午餐時段限定" },
    { name: "20 元折價券", status: "已過期", expiry: "2026/06/30", rule: "滿 150 折抵" }
  ],
  collection: [
    { name: "招牌控肉", rarity: "經典", unlocked: true },
    { name: "川味口水雞", rarity: "人氣", unlocked: true },
    { name: "香煎鮭魚", rarity: "稀有", unlocked: true },
    { name: "夏季西瓜餐盒", rarity: "季節限定", unlocked: false },
    { name: "傳說雞腿王", rarity: "傳說", unlocked: false }
  ],
  shop: [
    { name: "LAI 保冷袋", price: "800 點", stock: "剩 12" },
    { name: "限定餐盒", price: "1200 點", stock: "剩 5" },
    { name: "馬克杯", price: "600 點", stock: "補貨中" },
    { name: "神秘便當抽獎券", price: "100 點", stock: "每日 1 張" }
  ],
  chats: [
    { room: "世界聊天", user: "Kevin", text: "今天控肉超神，肥而不膩！" },
    { room: "好友聊天", user: "Amy", text: "晚上一起團訂嗎？" },
    { room: "社群聊天", user: "健身餐社", text: "健康王挑戰第 3 天開跑。" }
  ],
  posts: [
    { user: "Hana", meal: "香煎鮭魚健康餐", rating: 5, likes: 128, text: "今天這盒很可以，南瓜超甜。" },
    { user: "James", meal: "招牌控肉便當", rating: 5, likes: 86, text: "控肉派集合。" },
    { user: "Yu Zi", meal: "舒肥雞胸", rating: 4, likes: 72, text: "輕食日，下午不想睡。" }
  ],
  map: [
    { area: "北屯", event: "好友 Kevin 正在吃雞腿便當", tag: "5 分鐘前" },
    { area: "西屯", event: "企業團購點開團", tag: "12 份成團" },
    { area: "南屯", event: "健康餐打卡熱區", tag: "今日 48 人" }
  ],
  table: {
    decorations: ["木質餐桌", "小葉盆栽", "LAI 吉祥物公仔", "夏日餐墊", "金色便當徽章"]
  },
  bag: [
    { type: "道具", name: "刮刮卡 x3" },
    { type: "禮券", name: "滷蛋券 x2" },
    { type: "裝飾", name: "小葉盆栽" },
    { type: "收藏", name: "控肉圖鑑卡" }
  ],
  outfit: ["金色頭像框", "便當王稱號", "LAI 圍裙", "健康達人徽章"],
  events: [
    { name: "夏日西瓜季", progress: "3/7 天", reward: "限定餐盒" },
    { name: "企業團購月", progress: "28/50 份", reward: "團體折價券" },
    { name: "健康餐連吃挑戰", progress: "5/10 天", reward: "健康王徽章" }
  ],
  games: [
    { name: "每日轉盤", cost: "20 點", reward: "最高 200 點" },
    { name: "刮刮卡", cost: "1 禮券", reward: "折價券 / 小菜券" },
    { name: "神秘便當抽獎", cost: "100 點", reward: "免費便當" }
  ],
  orders: [
    { id: "LAI-20260704-001", status: "已完成", total: "$120", item: "招牌控肉便當" },
    { id: "LAI-20260703-086", status: "已完成", total: "$200", item: "香煎鮭魚健康餐" },
    { id: "LAI-20260702-052", status: "製作中", total: "$140", item: "舒肥雞胸健康餐" }
  ],
  notifications: [
    "王小明送你 50 點",
    "雞腿升級券將於 3 天後到期",
    "你在便當王排行榜上升 1 名",
    "今日任務已完成 1/4",
    "訂單 LAI-20260702-052 製作中"
  ]
};

window.LAI_LIFE_API = {
  getState() {
    return Promise.resolve(window.LAI_LIFE_DATA);
  },
  updateWallet(patch) {
    Object.assign(window.LAI_LIFE_DATA.wallet, patch);
    return Promise.resolve(window.LAI_LIFE_DATA.wallet);
  },
  completeTask(taskId) {
    const task = window.LAI_LIFE_DATA.tasks.find(item => item.id === taskId);
    if (task) task.done = true;
    return Promise.resolve(task);
  },
  sendMockMessage(text) {
    window.LAI_LIFE_DATA.chats.unshift({ room: "世界聊天", user: window.LAI_LIFE_DATA.member.name, text });
    return Promise.resolve(window.LAI_LIFE_DATA.chats[0]);
  },
  addNotification(text) {
    window.LAI_LIFE_DATA.notifications.unshift(text);
    return Promise.resolve(text);
  }
};
