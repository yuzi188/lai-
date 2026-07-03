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

  function walkTo(target) {
    const player = document.querySelector("#lifePlayer");
    if (!player) return;
    const x = Number(target.dataset.x || 50);
    const y = Number(target.dataset.y || 66);
    const destination = target.dataset.lifeWalk;
    player.classList.add("walking");
    player.style.left = `${x}%`;
    player.style.top = `${y}%`;
    player.style.bottom = "auto";
    toast(`前往 ${target.getAttribute("aria-label") || "小鎮地點"}`);
    window.setTimeout(() => {
      player.classList.remove("walking");
      if (destination === "checkin") actions.checkin();
      else openModal(destination);
    }, 720);
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
      title: "補充資源",
      kicker: "WALLET",
      render: () => cardGrid([
        infoCard("金幣點數", `${fmt(data.wallet.coins)} 點，可兌換商城商品與禮券`, "目前持有"),
        infoCard("禮券", `${fmt(data.wallet.tickets)} 張，可用於抽獎、送禮或加菜`, "目前持有"),
        infoCard("愛心體力", `${data.wallet.hearts}/${data.wallet.maxHearts}，每日任務與小遊戲會消耗`, "今日體力"),
        `<article class="life-modal-card accent"><strong>Mock 操作</strong><p>點擊下方按鈕會立即補滿愛心並增加 100 點。</p><button data-life-action="refill">補充資源</button></article>`
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
          <button data-life-task-modal="${esc(task.id)}">${task.done ? "領取" : "模擬完成"}</button>
        </article>
      `))
    },
    checkin: {
      title: "每日簽到",
      kicker: "CHECK IN",
      render: () => `
        ${cardGrid([
          infoCard("連續簽到", `${data.signIn.streak} 天`, "今日狀態"),
          infoCard("今日獎勵", data.signIn.todayReward, data.signIn.signed ? "已領取" : "可領取")
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
          infoCard("邀請成功", "你 +100，朋友 +100", "首次加入"),
          infoCard("朋友首次消費", "雙方再 +500", "裂變獎勵")
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
        <div class="life-search-line"><input placeholder="搜尋好友名稱或手機"><button data-life-action="addFriend">加好友</button></div>
        ${list(data.friends.map(friend => `
          <article class="life-modal-row">
            <b>${esc(friend.status)}</b><strong>${esc(friend.name)}</strong><span>正在吃：${esc(friend.lastMeal)}｜${esc(friend.note)}</span><button data-life-open="gifts">送禮</button>
          </article>
        `))}
      `
    },
    gifts: {
      title: "禮物",
      kicker: "GIFT BOX",
      render: () => `
        <p class="life-modal-note">每日可送 3 個禮物，目前剩餘 2 次。收到的人會收到通知。</p>
        ${cardGrid(data.gifts.map(gift => `<article class="life-modal-card"><span>庫存 ${gift.stock}</span><strong>${esc(gift.name)}</strong><p>消耗 ${gift.cost} 點</p><button data-life-action="sendGift">送給好友</button></article>`))}
        <h3>收禮通知</h3>
        ${list(["王小明送你 50 點", "Amy 送你滷蛋券", "Kevin 送你飲料券"].map(item => `<article class="life-modal-row"><strong>${esc(item)}</strong><button data-life-action="receiveGift">領取</button></article>`))}
      `
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
        ${list(data.posts.map(post => `<article class="life-post-card"><strong>${esc(post.user)}｜${esc(post.meal)}</strong><p>${"★".repeat(post.rating)} ${esc(post.text)}</p><span>${post.likes} 個愛心 · 留言 · 分享</span></article>`))}
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
        <div class="life-table-preview"><span></span><b>LAI 個人展示餐桌</b></div>
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
        infoCard("夏日西瓜季", "等級 8 / 30，解鎖限定頭像框", "進行中"),
        infoCard("免費路線", "滷蛋券、點數、刮刮卡", "已領 5 項"),
        infoCard("進階路線", "限定餐盒、保冷袋、金色徽章", "未啟用")
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
      toast("資源已補充：+100 點，愛心已補滿");
      openModal("resources");
    },
    checkin() {
      if (data.signIn.signed) {
        toast("今天已經簽到囉");
        return;
      }
      data.signIn.signed = true;
      data.wallet.coins += 20;
      data.signIn.streak += 1;
      syncWallet();
      document.querySelector(".life-checkin-card p").textContent = `連續 ${data.signIn.streak} 天`;
      document.querySelectorAll("[data-life-action='checkin']").forEach(button => {
        if (button.classList.contains("checked")) button.textContent = "已簽到";
      });
      toast("簽到成功：+20 點");
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
      toast("任務獎勵已領取");
      openModal("tasks");
    },
    receiveGift() {
      data.wallet.coins += 50;
      syncWallet();
      toast("已領取好友禮物：+50 點");
    },
    sendGift: () => toast("已送出 mock 禮物"),
    useCoupon: () => toast("已套用 mock 禮券"),
    redeemShop: () => toast("兌換申請已建立"),
    playGame: () => toast("小遊戲結果：獲得 20 點"),
    copyInvite: () => {
      navigator.clipboard?.writeText("https://lai.app/invite/LAI-8W91");
      toast("邀請連結已複製");
    },
    addFriend: () => toast("已送出好友邀請"),
    newPost: () => toast("已建立 mock 貼文"),
    mapPin: () => toast("已標記地圖點"),
    decorate: () => toast("已更換我的餐桌裝飾"),
    useItem: () => toast("已使用背包道具"),
    equip: () => toast("已更新裝扮"),
    joinEvent: () => toast("已加入活動"),
    trackOrder: () => toast("訂單追蹤已開啟"),
    readNotice: event => event.target.closest(".life-modal-row")?.remove()
  };

  document.addEventListener("click", event => {
    const openTarget = event.target.closest("[data-life-open]");
    if (openTarget) {
      event.preventDefault();
      openModal(openTarget.dataset.lifeOpen);
      return;
    }
    const walkTarget = event.target.closest("[data-life-walk]");
    if (walkTarget) {
      event.preventDefault();
      walkTo(walkTarget);
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
    toast("訊息已送出");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  syncWallet();
})();
