(function () {
  const data = window.LAI_LIFE_DATA;
  const modal = document.querySelector("#lifeModal");
  const title = document.querySelector("#lifeModalTitle");
  const kicker = document.querySelector("#lifeModalKicker");
  const body = document.querySelector("#lifeModalBody");

  const fmt = value => Number(value || 0).toLocaleString("zh-TW");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));

  function cardGrid(items) {
    return `<div class="life-modal-grid">${items.join("")}</div>`;
  }

  function infoCard(titleText, bodyText, meta = "") {
    return `<article class="life-modal-card"><span>${esc(meta)}</span><strong>${esc(titleText)}</strong><p>${esc(bodyText)}</p></article>`;
  }

  function list(items) {
    return `<div class="life-modal-list">${items.join("")}</div>`;
  }

  function openModal(key) {
    const view = views[key] || views.notifications;
    kicker.textContent = view.kicker || "LAI LIFE";
    title.textContent = view.title;
    body.innerHTML = view.render();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function syncWallet() {
    document.querySelector("[data-life-value='coins']").textContent = fmt(data.wallet.coins);
    document.querySelector("[data-life-value='tickets']").textContent = fmt(data.wallet.tickets);
    document.querySelector("[data-life-value='hearts']").textContent = `${data.wallet.hearts}/${data.wallet.maxHearts}`;
  }

  const rankingNames = {
    bento: "便當王排行",
    gift: "送禮王排行",
    invite: "邀請王排行",
    healthy: "健康王排行",
    checkin: "打卡王排行",
    share: "分享王排行"
  };

  const views = {
    resources: {
      title: "資源補給",
      kicker: "WALLET",
      render: () => cardGrid([
        infoCard("金幣", `${fmt(data.wallet.coins)} 枚，可兌換商品、禮券與抽獎。`, "目前持有"),
        infoCard("禮券", `${fmt(data.wallet.tickets)} 張，可用於刮刮卡、折價券與送禮。`, "目前持有"),
        infoCard("愛心體力", `${data.wallet.hearts}/${data.wallet.maxHearts}，用於社交互動與每日任務。`, "今日體力"),
        `<article class="life-modal-card accent"><strong>Mock 操作</strong><p>點擊後補滿愛心並增加 100 金幣。</p><button data-life-action="refill">補充資源</button></article>`
      ])
    },
    tasks: {
      title: "每日任務",
      kicker: "DAILY LOOP",
      render: () => list(data.tasks.map(task => `
        <article class="life-modal-row">
          <b>${task.done ? "完成" : "未完成"}</b>
          <strong>${esc(task.label)}</strong>
          <span>${esc(task.reward)}</span>
          <button data-life-task-modal="${esc(task.id)}">${task.done ? "已領取" : "標記完成"}</button>
        </article>
      `))
    },
    checkin: {
      title: "每日簽到",
      kicker: "CHECK IN",
      render: () => `
        ${cardGrid([
          infoCard("連續簽到", `${data.signIn.streak} 天`, "今日狀態"),
          infoCard("今日獎勵", data.signIn.todayReward, data.signIn.signed ? "已簽到" : "可領取")
        ])}
        <div class="life-signin-week">
          ${data.signIn.week.map(day => `<span class="${day.claimed ? "done" : ""}"><b>D${day.day}</b>${esc(day.reward)}</span>`).join("")}
        </div>
        <button class="life-wide-button" data-life-action="checkin">${data.signIn.signed ? "今日已簽到" : "立即簽到"}</button>
      `
    },
    invite: {
      title: "邀請好友",
      kicker: "REFERRAL",
      render: () => `
        ${cardGrid([
          infoCard("你的邀請碼", "LAI-8W91", "分享給朋友"),
          infoCard("邀請成功", "你 +100，朋友 +100", "完成註冊"),
          infoCard("首次消費", "雙方再 +500", "加碼獎勵")
        ])}
        <div class="life-copy-box"><code>https://lai.app/invite/LAI-8W91</code><button data-life-action="copyInvite">複製邀請連結</button></div>
      `
    },
    rankings: {
      title: "排行榜",
      kicker: "WEEKLY RANK",
      render: () => Object.entries(data.rankings).map(([key, rows]) => `
        <section class="life-rank-section">
          <h3>${rankingNames[key]}</h3>
          <ol>${rows.map((row, index) => `<li class="${index < 3 ? "top" : ""}"><span>${index + 1}</span><strong>${esc(row[0])}</strong><b>${esc(row[1])}</b></li>`).join("")}</ol>
        </section>
      `).join("")
    },
    friends: {
      title: "好友",
      kicker: "FRIENDS",
      render: () => `
        <div class="life-search-line"><input placeholder="搜尋好友姓名或邀請碼"><button data-life-action="addFriend">加好友</button></div>
        ${list(data.friends.map(friend => `
          <article class="life-modal-row">
            <b>${esc(friend.status)}</b><strong>${esc(friend.name)}</strong><span>最近吃：${esc(friend.lastMeal)}｜${esc(friend.note)}</span><button data-life-open="gifts">送禮</button>
          </article>
        `))}
      `
    },
    gifts: {
      title: "禮物",
      kicker: "GIFT BOX",
      render: () => `
        <p class="life-modal-note">每日可送 3 個禮物，目前剩餘 2 次。收到的人會收到通知。</p>
        ${cardGrid(data.gifts.map(gift => `<article class="life-modal-card"><span>庫存 ${gift.stock}</span><strong>${esc(gift.name)}</strong><p>消耗 ${gift.cost} 金幣</p><button data-life-action="sendGift">送給好友</button></article>`))}
        <h3>收禮紀錄</h3>
        ${list(["王小明送你 50 金幣", "Amy 送你滷蛋券", "Kevin 送你飲料券"].map(item => `<article class="life-modal-row"><strong>${esc(item)}</strong><button data-life-action="receiveGift">領取</button></article>`))}
      `
    },
    friendActions: {
      title: "好友互動",
      kicker: "FRIEND",
      render: () => cardGrid([
        `<article class="life-modal-card accent"><strong>打招呼</strong><p>消耗 1 愛心，增加好友親密度。</p><button data-life-action="greetFriend">打招呼</button></article>`,
        `<article class="life-modal-card"><strong>送禮物</strong><p>選擇折價券、滷蛋券、飲料券或金幣送出。</p><button data-life-open="gifts">送禮</button></article>`,
        `<article class="life-modal-card"><strong>最近吃什麼</strong><p>王小明剛吃了舒肥雞胸健康餐。</p><button data-life-open="friends">查看好友</button></article>`
      ])
    },
    garden: {
      title: "LAI 小菜園",
      kicker: "GARDEN",
      render: () => cardGrid([
        infoCard("今日可收成", "青花菜、南瓜、紫高麗菜", "固定配菜"),
        infoCard("菜園等級", "Lv.6，明日解鎖玉米筍", "成長中"),
        `<article class="life-modal-card accent"><strong>收成小菜</strong><p>Mock 操作：增加 20 金幣並完成分享任務。</p><button data-life-action="harvestGarden">進入小菜園</button></article>`
      ])
    },
    npcDialogue: {
      title: "小鎮居民",
      kicker: "NPC",
      render: () => `<article class="life-modal-card accent"><strong>${esc(data.currentNpc?.name || "LAI 夥伴")}</strong><p>${esc(data.currentNpc?.line || "今天也要好好吃飯。")}</p><button data-life-open="${esc(data.currentNpc?.open || "tasks")}">前往相關功能</button></article>`
    },
    coupons: {
      title: "我的禮券",
      kicker: "COUPONS",
      render: () => cardGrid(data.coupons.map(coupon => `<article class="life-modal-card"><span>${esc(coupon.status)}</span><strong>${esc(coupon.name)}</strong><p>${esc(coupon.rule)}</p><small>到期日 ${esc(coupon.expiry)}</small><button data-life-action="useCoupon">使用</button></article>`))
    },
    collection: {
      title: "收藏冊",
      kicker: "BENTO DEX",
      render: () => `
        <p class="life-modal-note">集滿經典台味系列可獲得限定徽章。</p>
        ${cardGrid(data.collection.map(item => `<article class="life-modal-card ${item.unlocked ? "" : "locked"}"><span>${esc(item.rarity)}</span><strong>${item.unlocked ? esc(item.name) : "未解鎖"}</strong><p>${item.unlocked ? "已吃過，可展示在我的餐桌。" : "完成指定任務後解鎖。"}</p></article>`))}
      `
    },
    shop: {
      title: "商城",
      kicker: "POINT SHOP",
      render: () => cardGrid(data.shop.map(item => `<article class="life-modal-card"><span>${esc(item.stock)}</span><strong>${esc(item.name)}</strong><p>${esc(item.price)}</p><button data-life-action="redeemShop">兌換</button></article>`))
    },
    chat: {
      title: "聊天",
      kicker: "CHAT",
      render: () => `
        ${list(data.chats.map(chat => `<article class="life-chat-row"><span>${esc(chat.room)}</span><strong>${esc(chat.user)}</strong><p>${esc(chat.text)}</p></article>`))}
        <form class="life-message-box" data-life-message><input placeholder="輸入 mock 訊息"><button>送出</button></form>
      `
    },
    community: {
      title: "社群貼文",
      kicker: "COMMUNITY",
      render: () => `
        <button class="life-wide-button" data-life-action="newPost">發布便當照片</button>
        ${list(data.posts.map(post => `<article class="life-post-card"><strong>${esc(post.user)}｜${esc(post.meal)}</strong><p>${"★".repeat(post.rating)} ${esc(post.text)}</p><span>${post.likes} 個愛心｜留言｜分享</span></article>`))}
      `
    },
    map: {
      title: "地圖生活圈",
      kicker: "LOCAL MAP",
      render: () => cardGrid(data.map.map(point => `<article class="life-modal-card"><span>${esc(point.area)}</span><strong>${esc(point.event)}</strong><p>${esc(point.tag)}</p><button data-life-action="mapPin">查看</button></article>`))
    },
    table: {
      title: "我的餐桌",
      kicker: "MY TABLE",
      render: () => `
        <div class="life-table-preview"><span></span><b>LAI 木紋餐桌展示空間</b></div>
        ${cardGrid(data.table.decorations.map(item => `<article class="life-modal-card"><strong>${esc(item)}</strong><p>可擺放、替換、分享截圖。</p><button data-life-action="decorate">擺上餐桌</button></article>`))}
      `
    },
    bag: {
      title: "背包",
      kicker: "INVENTORY",
      render: () => cardGrid(data.bag.map(item => `<article class="life-modal-card"><span>${esc(item.type)}</span><strong>${esc(item.name)}</strong><p>可使用或展示。</p><button data-life-action="useItem">使用</button></article>`))
    },
    outfit: {
      title: "裝扮",
      kicker: "STYLE",
      render: () => cardGrid(data.outfit.map(item => `<article class="life-modal-card"><strong>${esc(item)}</strong><p>頭像、稱號、徽章與桌布外觀。</p><button data-life-action="equip">裝備</button></article>`))
    },
    events: {
      title: "活動",
      kicker: "EVENTS",
      render: () => cardGrid(data.events.map(event => `<article class="life-modal-card"><span>${esc(event.progress)}</span><strong>${esc(event.name)}</strong><p>獎勵：${esc(event.reward)}</p><button data-life-action="joinEvent">參加</button></article>`))
    },
    game: {
      title: "遊戲屋",
      kicker: "MINI GAMES",
      render: () => cardGrid(data.games.map(game => `<article class="life-modal-card"><span>${esc(game.cost)}</span><strong>${esc(game.name)}</strong><p>${esc(game.reward)}</p><button data-life-action="playGame">開始</button></article>`))
    },
    orders: {
      title: "訂單",
      kicker: "ORDERS",
      render: () => `
        ${list(data.orders.map(order => `<article class="life-modal-row"><b>${esc(order.status)}</b><strong>${esc(order.item)}</strong><span>${esc(order.id)}｜${esc(order.total)}</span><button data-life-action="trackOrder">追蹤</button></article>`))}
        <a class="life-wide-link" href="order.html">前往訂購頁</a>
      `
    },
    pass: {
      title: "通行證",
      kicker: "SEASON PASS",
      render: () => cardGrid([
        infoCard("本月進度", "8 / 30，解鎖限定餐桌", "普通通行證"),
        infoCard("免費獎勵", "滷蛋券、金幣、頭像框", "已領 5 格"),
        infoCard("高級獎勵", "限定桌布、飲料券、稀有徽章", "未啟用")
      ])
    },
    menu: {
      title: "選單",
      kicker: "MENU",
      render: () => cardGrid([
        `<article class="life-modal-card"><strong>健康輕食</strong><p>高蛋白、少油少鹽。</p><a href="menu.html">查看</a></article>`,
        `<article class="life-modal-card"><strong>經典台味</strong><p>控肉、排骨、口水雞。</p><a href="classic.html">查看</a></article>`,
        `<article class="life-modal-card"><strong>團訂</strong><p>企業與社群一起開團。</p><a href="group.html">查看</a></article>`
      ])
    },
    notifications: {
      title: "通知",
      kicker: "NOTIFICATIONS",
      render: () => list(data.notifications.map(item => `<article class="life-modal-row"><strong>${esc(item)}</strong><button data-life-action="readNotice">已讀</button></article>`))
    }
  };

  function toast(text) {
    const notice = document.createElement("div");
    notice.className = "life-toast";
    notice.textContent = text;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 1800);
  }

  const actions = {
    refill() {
      data.wallet.coins += 100;
      data.wallet.hearts = data.wallet.maxHearts;
      syncWallet();
      toast("資源已補充：+100 金幣，愛心補滿。");
      openModal("resources");
    },
    checkin() {
      if (data.signIn.signed) {
        toast("今天已經簽到。");
        return;
      }
      data.signIn.signed = true;
      data.wallet.coins += 20;
      data.signIn.streak += 1;
      syncWallet();
      const streakText = document.querySelector(".life-checkin-card p");
      if (streakText) streakText.textContent = `連續 ${data.signIn.streak} 天`;
      document.querySelectorAll("[data-life-action='checkin']").forEach(button => {
        if (button.classList.contains("checked")) button.textContent = "已簽到";
      });
      toast("簽到成功：+20 金幣。");
      openModal("checkin");
    },
    claimTasks() {
      data.tasks.forEach(task => { task.done = true; });
      data.wallet.coins += 30;
      data.wallet.tickets += 5;
      syncWallet();
      document.querySelectorAll("[data-life-task]").forEach(input => {
        input.checked = true;
        input.closest("label").querySelector("b").textContent = "1/1";
      });
      toast("任務獎勵已領取。");
      openModal("tasks");
    },
    receiveGift() {
      data.wallet.coins += 50;
      syncWallet();
      toast("收到好友禮物：+50 金幣。");
    },
    sendGift: () => toast("已送出 mock 禮物。"),
    greetFriend: () => toast("已和好友打招呼，親密度 +1。"),
    harvestGarden() {
      data.wallet.coins += 20;
      const shareTask = data.tasks.find(task => task.id === "share");
      if (shareTask) shareTask.done = true;
      syncWallet();
      toast("小菜園收成：+20 金幣。");
      openModal("garden");
    },
    useCoupon: () => toast("已套用 mock 禮券。"),
    redeemShop: () => toast("兌換成功，已放入背包。"),
    playGame: () => toast("小遊戲完成，獲得 20 金幣。"),
    copyInvite: () => {
      navigator.clipboard?.writeText("https://lai.app/invite/LAI-8W91");
      toast("邀請連結已複製。");
    },
    addFriend: () => toast("已送出好友邀請。"),
    newPost: () => toast("已發布 mock 貼文。"),
    mapPin: () => toast("已標記地圖點位。"),
    decorate: () => toast("已擺上我的餐桌。"),
    useItem: () => toast("已使用背包道具。"),
    equip: () => toast("已套用裝扮。"),
    joinEvent: () => toast("已加入活動。"),
    trackOrder: () => toast("訂單追蹤已開啟。"),
    readNotice: event => event.target.closest(".life-modal-row")?.remove()
  };

  function initTownGame() {
    const canvas = document.querySelector("#lifeGame");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const hint = document.querySelector("#lifeInteractionHint");
    const hintTitle = document.querySelector("#lifeInteractionTitle");
    const hintText = document.querySelector("#lifeInteractionText");
    const hintButton = document.querySelector("#lifeInteractButton");
    const joystick = document.querySelector("#lifeJoystick");
    const knob = document.querySelector("#lifeJoystickKnob");
    const world = { w: 1600, h: 1040 };
    const player = { x: 800, y: 690, w: 42, h: 56, speed: 220, moving: false, dir: "down" };
    const camera = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    const keys = new Set();
    const joy = { active: false, id: null, x: 0, y: 0 };
    const colors = {
      ink: "#47341d",
      wood: "#8b6f3c",
      green: "#6fb15d",
      grass: "#b9dc8d",
      path: "#e5c58c",
      cream: "#fff8da",
      sun: "#ffc84f"
    };

    const obstacles = [
      { x: 560, y: 120, w: 480, h: 230, label: "LAI便當店" },
      { x: 1165, y: 390, w: 230, h: 150, label: "商城攤位" },
      { x: 135, y: 430, w: 250, h: 125, label: "任務看板" },
      { x: 1040, y: 680, w: 210, h: 115, label: "好友長椅" },
      { x: 268, y: 698, w: 240, h: 130, label: "我的餐桌" },
      { x: 1320, y: 760, w: 120, h: 140, label: "背包屋" },
      { x: 112, y: 108, w: 122, h: 520, label: "左牆" },
      { x: 1435, y: 104, w: 112, h: 620, label: "右牆" },
      { x: 560, y: 860, w: 430, h: 75, label: "花圃" }
    ];

    const zones = [
      { id: "shop", x: 670, y: 358, w: 260, h: 120, title: "LAI便當店", text: "靠近店門可開始訂便當。", button: "去訂便當", open: "orders" },
      { id: "garden", x: 1090, y: 125, w: 300, h: 205, title: "小菜園", text: "今天青花菜、南瓜和紫高麗菜可以收成。", button: "進入小菜園", open: "garden" },
      { id: "friend", x: 980, y: 610, w: 250, h: 150, title: "好友廣場", text: "靠近好友可以送禮或打招呼。", button: "送禮 / 打招呼", open: "friendActions" },
      { id: "rank", x: 128, y: 560, w: 240, h: 120, title: "排行榜看板", text: "查看本週便當王與送禮王排行。", button: "看排行榜", open: "rankings" },
      { id: "tasks", x: 178, y: 342, w: 210, h: 110, title: "任務看板", text: "確認每日任務與獎勵。", button: "查看任務", open: "tasks" },
      { id: "mail", x: 1265, y: 600, w: 130, h: 120, title: "禮物郵箱", text: "收取好友送來的禮物。", button: "查看禮物", open: "gifts" },
      { id: "table", x: 278, y: 832, w: 260, h: 120, title: "我的餐桌", text: "擺放收藏、便當和裝飾。", button: "進入餐桌", open: "table" },
      { id: "shopStand", x: 1150, y: 540, w: 245, h: 116, title: "點數商城", text: "兌換折價券、加菜券與周邊。", button: "逛商城", open: "shop" }
    ];

    const npcs = [
      { name: "小賴", x: 702, y: 590, color: "#f3a65d", line: "今天推薦香煎鮭魚健康餐，清爽但很有飽足感。", open: "menu" },
      { name: "王小明", x: 1050, y: 604, color: "#f0c16d", line: "我今天有多一張滷蛋券，要互送禮物嗎？", open: "friendActions" },
      { name: "園丁阿青", x: 1225, y: 326, color: "#7fb86f", line: "小菜園的南瓜熟了，進來收成吧。", open: "garden" },
      { name: "榜單員", x: 250, y: 622, color: "#a7d9d0", line: "本週便當王競爭很激烈，你只差一點就進前三。", open: "rankings" }
    ];

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function rectsOverlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function playerRect(x = player.x, y = player.y) {
      return { x: x - player.w / 2, y: y - player.h + 9, w: player.w, h: player.h - 10 };
    }

    function canStand(x, y) {
      const rect = playerRect(x, y);
      if (rect.x < 26 || rect.y < 48 || rect.x + rect.w > world.w - 26 || rect.y + rect.h > world.h - 26) return false;
      return !obstacles.some(obstacle => rectsOverlap(rect, obstacle));
    }

    function movePlayer(dx, dy) {
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (canStand(nx, player.y)) player.x = nx;
      if (canStand(player.x, ny)) player.y = ny;
    }

    function zoneDistance(zone) {
      const cx = clamp(player.x, zone.x, zone.x + zone.w);
      const cy = clamp(player.y - 24, zone.y, zone.y + zone.h);
      return Math.hypot(player.x - cx, player.y - 24 - cy);
    }

    function nearestZone() {
      return zones
        .map(zone => ({ zone, distance: zoneDistance(zone) }))
        .filter(item => item.distance < 92)
        .sort((a, b) => a.distance - b.distance)[0]?.zone || null;
    }

    function updateHint(zone) {
      if (!zone) {
        hint.hidden = true;
        return;
      }
      hint.hidden = false;
      hintTitle.textContent = zone.title;
      hintText.textContent = zone.text;
      hintButton.textContent = zone.button;
      hintButton.onclick = () => openModal(zone.open);
    }

    function worldPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX + camera.x,
        y: (event.clientY - rect.top) * scaleY + camera.y
      };
    }

    function drawRoundedRect(x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }

    function label(text, x, y, bg = "rgba(255,248,218,.92)") {
      ctx.font = "900 18px 'Noto Sans TC', sans-serif";
      const w = ctx.measureText(text).width + 26;
      drawRoundedRect(x - w / 2, y - 28, w, 34, 17, bg, "rgba(112,76,37,.16)");
      ctx.fillStyle = colors.ink;
      ctx.textAlign = "center";
      ctx.fillText(text, x, y - 5);
    }

    function drawTree(x, y, scale = 1) {
      ctx.fillStyle = "#8b6f3c";
      ctx.fillRect(x - 8 * scale, y + 24 * scale, 16 * scale, 42 * scale);
      ctx.fillStyle = "#6fb15d";
      ctx.beginPath();
      ctx.arc(x, y, 38 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,248,218,.22)";
      ctx.beginPath();
      ctx.arc(x - 14 * scale, y - 11 * scale, 13 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawNpc(npc, time) {
      const bob = Math.sin(time / 420 + npc.x) * 2;
      ctx.fillStyle = "rgba(58,43,27,.16)";
      ctx.beginPath();
      ctx.ellipse(npc.x, npc.y + 16, 27, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y - 12 + bob, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f2a13";
      ctx.beginPath();
      ctx.arc(npc.x - 8, npc.y - 15 + bob, 3.5, 0, Math.PI * 2);
      ctx.arc(npc.x + 8, npc.y - 15 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3f2a13";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y - 9 + bob, 7, 0.1, Math.PI - 0.1);
      ctx.stroke();
      label(npc.name, npc.x, npc.y - 44 + bob, "#fffdf7");
    }

    function drawPlayer(time) {
      const bob = player.moving ? Math.sin(time / 90) * 5 : Math.sin(time / 580) * 2;
      ctx.fillStyle = "rgba(58,43,27,.18)";
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 13, 32, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f2a13";
      drawRoundedRect(player.x - 23, player.y - 22 + bob, 46, 42, 14, "#3f2a13");
      ctx.fillStyle = "#f3a65d";
      ctx.beginPath();
      ctx.arc(player.x, player.y - 42 + bob, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff7db";
      ctx.beginPath();
      ctx.ellipse(player.x, player.y - 33 + bob, 18, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f2a13";
      ctx.beginPath();
      ctx.arc(player.x - 9, player.y - 45 + bob, 4, 0, Math.PI * 2);
      ctx.arc(player.x + 9, player.y - 45 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.sun;
      ctx.font = "900 14px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LAI", player.x, player.y - 3 + bob);
    }

    function drawScene(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      ctx.fillStyle = "#9fd7ee";
      ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
      ctx.fillStyle = colors.grass;
      ctx.fillRect(0, 0, world.w, world.h);

      ctx.fillStyle = "#eac88d";
      ctx.beginPath();
      ctx.ellipse(800, 690, 600, 240, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,253,247,.45)";
      ctx.beginPath();
      ctx.ellipse(800, 690, 430, 145, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 22; i += 1) drawTree(60 + i * 74, 70 + (i % 3) * 22, 0.82);
      for (let i = 0; i < 10; i += 1) drawTree(70 + i * 148, 965 - (i % 2) * 18, 0.9);

      drawRoundedRect(560, 120, 480, 230, 26, "#fff3d6", "rgba(112,76,37,.26)");
      drawRoundedRect(602, 70, 396, 72, 28, "#b87945", "rgba(112,76,37,.25)");
      drawRoundedRect(620, 142, 360, 58, 20, "#ffd866");
      ctx.fillStyle = colors.ink;
      ctx.font = "900 42px 'Noto Sans TC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LAI 便當", 800, 178);
      drawRoundedRect(735, 240, 130, 110, 16, "#8b6f3c");
      label("去訂便當", 800, 390);

      drawRoundedRect(1090, 125, 300, 205, 20, "#f3e2bd", "rgba(112,76,37,.22)");
      ["#6fb15d", "#f6a84f", "#9c4b83"].forEach((color, index) => {
        ctx.fillStyle = color;
        for (let j = 0; j < 5; j += 1) {
          ctx.beginPath();
          ctx.arc(1130 + j * 48, 175 + index * 44, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      label("小菜園", 1240, 120);

      drawRoundedRect(1165, 390, 230, 150, 16, "#fff8da", "rgba(112,76,37,.24)");
      drawRoundedRect(1182, 362, 196, 38, 14, "#79a95d");
      label("今日推薦", 1280, 450);
      ctx.fillStyle = "#ffc84f";
      ctx.beginPath();
      ctx.ellipse(1280, 488, 58, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      drawRoundedRect(135, 430, 250, 125, 14, "#fff8da", "rgba(112,76,37,.2)");
      label("任務看板", 260, 420);
      drawRoundedRect(135, 560, 250, 120, 14, "#fff8da", "rgba(112,76,37,.2)");
      label("排行榜", 260, 550);
      drawRoundedRect(1265, 600, 130, 120, 12, "#e96f57", "rgba(112,76,37,.2)");
      label("禮物郵箱", 1330, 590);
      drawRoundedRect(1040, 680, 210, 115, 16, "#b87945", "rgba(112,76,37,.2)");
      label("好友廣場", 1145, 668);
      drawRoundedRect(268, 698, 240, 130, 18, "#fff8da", "rgba(112,76,37,.2)");
      label("我的餐桌", 388, 690);
      drawRoundedRect(1320, 760, 120, 140, 18, "#64a6df", "rgba(112,76,37,.2)");
      label("背包屋", 1380, 750);

      const activeZone = nearestZone();
      zones.forEach(zone => {
        ctx.strokeStyle = activeZone === zone ? "rgba(255,200,79,.95)" : "rgba(255,248,218,.45)";
        ctx.lineWidth = activeZone === zone ? 5 : 2;
        ctx.setLineDash(activeZone === zone ? [10, 8] : [4, 12]);
        drawRoundedRect(zone.x, zone.y, zone.w, zone.h, 20, null, ctx.strokeStyle);
        ctx.setLineDash([]);
      });

      npcs.forEach(npc => drawNpc(npc, time));
      drawPlayer(time);
      ctx.restore();
    }

    function update(dt) {
      let vx = 0;
      let vy = 0;
      if (keys.has("arrowleft") || keys.has("a")) vx -= 1;
      if (keys.has("arrowright") || keys.has("d")) vx += 1;
      if (keys.has("arrowup") || keys.has("w")) vy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) vy += 1;
      vx += joy.x;
      vy += joy.y;
      const length = Math.hypot(vx, vy);
      player.moving = length > 0.05;
      if (player.moving) {
        vx /= length;
        vy /= length;
        player.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
        movePlayer(vx * player.speed * dt, vy * player.speed * dt);
      }
      camera.x = clamp(player.x - canvas.width / 2, 0, world.w - canvas.width);
      camera.y = clamp(player.y - canvas.height / 2, 0, world.h - canvas.height);
      updateHint(nearestZone());
    }

    function loop(time) {
      const now = time || 0;
      const dt = Math.min((now - (loop.last || now)) / 1000, 0.05);
      loop.last = now;
      update(dt);
      drawScene(now);
      requestAnimationFrame(loop);
    }

    canvas.addEventListener("click", event => {
      const point = worldPoint(event);
      const npc = npcs.find(item => Math.hypot(point.x - item.x, point.y - item.y) < 48);
      if (!npc) return;
      data.currentNpc = npc;
      openModal("npcDialogue");
    });

    window.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
    }, { passive: false });

    window.addEventListener("keyup", event => {
      keys.delete(event.key.toLowerCase());
    });

    function setJoystick(event) {
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.min(Math.hypot(dx, dy), rect.width * 0.36);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * distance;
      const ky = Math.sin(angle) * distance;
      joy.x = kx / (rect.width * 0.36);
      joy.y = ky / (rect.height * 0.36);
      knob.style.transform = `translate(${kx}px, ${ky}px)`;
    }

    function resetJoystick() {
      joy.active = false;
      joy.id = null;
      joy.x = 0;
      joy.y = 0;
      knob.style.transform = "translate(0, 0)";
    }

    if (joystick) {
      joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        joy.active = true;
        joy.id = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        setJoystick(event);
      });
      joystick.addEventListener("pointermove", event => {
        if (!joy.active || event.pointerId !== joy.id) return;
        event.preventDefault();
        setJoystick(event);
      });
      joystick.addEventListener("pointerup", resetJoystick);
      joystick.addEventListener("pointercancel", resetJoystick);
      joystick.addEventListener("lostpointercapture", resetJoystick);
    }

    requestAnimationFrame(loop);
  }

  document.addEventListener("click", event => {
    const openTarget = event.target.closest("[data-life-open]");
    if (openTarget) {
      event.preventDefault();
      openModal(openTarget.dataset.lifeOpen);
      return;
    }
    const actionTarget = event.target.closest("[data-life-action]");
    if (actionTarget) {
      event.preventDefault();
      const action = actions[actionTarget.dataset.lifeAction];
      if (action) action(event);
      return;
    }
    if (event.target.closest("[data-life-close]")) closeModal();
  });

  document.addEventListener("change", event => {
    const task = event.target.closest("[data-life-task]");
    if (!task) return;
    const id = task.dataset.lifeTask;
    const mockTask = data.tasks.find(item => item.id === id);
    if (mockTask) mockTask.done = task.checked;
    task.closest("label").querySelector("b").textContent = task.checked ? "1/1" : "0/1";
  });

  document.addEventListener("submit", event => {
    if (!event.target.matches("[data-life-message]")) return;
    event.preventDefault();
    const input = event.target.querySelector("input");
    if (!input.value.trim()) return;
    data.chats.unshift({ room: "世界聊天", user: data.member.name, text: input.value.trim() });
    input.value = "";
    openModal("chat");
    toast("訊息已送出。");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  syncWallet();
  initTownGame();
})();
