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
    { id: "buy", label: "購買 1 份便當", reward: "+30 金幣", done: true },
    { id: "share", label: "分享便當照片", reward: "+20 金幣", done: false },
    { id: "gift", label: "送禮給好友", reward: "+20 金幣", done: false },
    { id: "invite", label: "邀請好友", reward: "+100 金幣", done: false }
  ],
  signIn: {
    signed: false,
    streak: 15,
    todayReward: "+20 金幣",
    week: [
      { day: 1, reward: "10 金幣", claimed: true },
      { day: 2, reward: "滷蛋券", claimed: true },
      { day: 3, reward: "20 金幣", claimed: true },
      { day: 4, reward: "飲料券", claimed: false },
      { day: 5, reward: "30 金幣", claimed: false },
      { day: 6, reward: "加菜券", claimed: false },
      { day: 7, reward: "限定餐盒", claimed: false }
    ]
  },
  rankings: {
    bento: [["Kevin", "1280 份"], ["Amy", "952 份"], ["James", "846 份"], ["Yu Zi", "728 份"], ["Hana", "610 份"]],
    gift: [["Mina", "88 次"], ["Kevin", "76 次"], ["Yu Zi", "38 次"]],
    invite: [["Amy", "42 人"], ["Ray", "31 人"], ["Yu Zi", "18 人"]],
    healthy: [["Leo", "21 天"], ["Yu Zi", "16 天"], ["Annie", "12 天"]],
    checkin: [["Yu Zi", "15 天"], ["Kevin", "13 天"], ["Hana", "11 天"]],
    share: [["Nora", "62 篇"], ["Yu Zi", "37 篇"], ["James", "31 篇"]]
  },
  friends: [
    { name: "王小明", status: "在線", lastMeal: "舒肥雞胸便當", note: "5 分鐘前" },
    { name: "Amy", status: "忙碌中", lastMeal: "香煎雞腿排", note: "北屯店" },
    { name: "Kevin", status: "離線", lastMeal: "控肉便當", note: "昨天 12:10" },
    { name: "Hana", status: "在線", lastMeal: "香煎鮭魚健康餐", note: "健康打卡" }
  ],
  gifts: [
    { name: "滷蛋券", cost: 3, stock: 8 },
    { name: "飲料券", cost: 5, stock: 5 },
    { name: "雞腿升級券", cost: 12, stock: 2 },
    { name: "10 元折價券", cost: 10, stock: 20 },
    { name: "50 金幣禮包", cost: 0, stock: 1 }
  ],
  coupons: [
    { name: "雞腿升級券", status: "可使用", expiry: "2026/07/31", rule: "經典台味滿 120 元可用" },
    { name: "滷蛋券", status: "可使用", expiry: "2026/07/20", rule: "任一便當可加贈" },
    { name: "飲料券", status: "已使用", expiry: "2026/07/12", rule: "今日推薦可搭配" },
    { name: "20 元折價券", status: "已過期", expiry: "2026/06/30", rule: "滿 150 元折抵" }
  ],
  collection: [
    { name: "招牌控肉", rarity: "經典", unlocked: true },
    { name: "川味口水雞", rarity: "人氣", unlocked: true },
    { name: "香煎鮭魚", rarity: "健康", unlocked: true },
    { name: "季節南瓜餐盒", rarity: "限定", unlocked: false },
    { name: "隱藏版雞腿", rarity: "稀有", unlocked: false }
  ],
  shop: [
    { name: "LAI 保溫提袋", price: "800 金幣", stock: "剩 12" },
    { name: "限定桌布", price: "1200 金幣", stock: "剩 5" },
    { name: "頭像框", price: "600 金幣", stock: "常駐" },
    { name: "神秘便當抽獎券", price: "100 金幣", stock: "每日 1 張" }
  ],
  chats: [
    { room: "世界聊天", user: "Kevin", text: "今天控肉很可以，醬汁很香。" },
    { room: "好友聊天", user: "Amy", text: "等等一起開團訂嗎？" },
    { room: "社群聊天", user: "健康餐社群", text: "健康王排行榜還有 3 天結算。" }
  ],
  posts: [
    { user: "Hana", meal: "香煎鮭魚健康餐", rating: 5, likes: 128, text: "今天蔬菜份量剛好，鮭魚很嫩。" },
    { user: "James", meal: "招牌控肉便當", rating: 5, likes: 86, text: "控肉入味但不膩。" },
    { user: "Yu Zi", meal: "香煎雞腿排", rating: 4, likes: 72, text: "雞腿皮脆，配菜也清爽。" }
  ],
  map: [
    { area: "北屯", event: "好友 Kevin 正在吃控肉便當", tag: "5 分鐘前" },
    { area: "西屯", event: "企業團訂即將成團", tag: "12 份待湊" },
    { area: "南屯", event: "健康餐桌挑戰", tag: "今日 48 人" }
  ],
  table: {
    decorations: ["木紋餐桌", "小盆栽", "LAI 招牌公仔", "每日餐墊", "便當收藏展示架"]
  },
  bag: [
    { type: "道具", name: "加菜券 x3" },
    { type: "禮券", name: "滷蛋券 x2" },
    { type: "裝飾", name: "小盆栽" },
    { type: "收藏", name: "控肉徽章" }
  ],
  outfit: ["創始會員頭像框", "便當王稱號", "LAI 店員帽", "健康達人徽章"],
  events: [
    { name: "夏日南瓜季", progress: "3/7 天", reward: "限定桌布" },
    { name: "企業團訂挑戰", progress: "28/50 份", reward: "團體折價券" },
    { name: "健康餐連續打卡", progress: "5/10 天", reward: "健康王徽章" }
  ],
  games: [
    { name: "每日轉盤", cost: "20 金幣", reward: "最高 200 金幣" },
    { name: "刮刮卡", cost: "1 禮券", reward: "團體券 / 小菜券" },
    { name: "神秘便當抽獎", cost: "100 金幣", reward: "免費便當" }
  ],
  orders: [
    { id: "LAI-20260704-001", status: "已完成", total: "$120", item: "招牌控肉便當" },
    { id: "LAI-20260703-086", status: "已完成", total: "$200", item: "香煎鮭魚健康餐" },
    { id: "LAI-20260702-052", status: "製作中", total: "$140", item: "香煎雞腿排健康餐" }
  ],
  notifications: [
    "王小明送你 50 金幣",
    "雞腿升級券還有 3 天到期",
    "你在便當王排行上升 1 名",
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
