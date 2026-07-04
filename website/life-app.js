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

  const profile = {
    name: "Yu Zi",
    title: "\u4fbf\u7576\u738b",
    avatar: "dog",
    frame: "gold",
    uniform: "staff",
    badge: "gold",
    background: "shop",
    declaration: "\u4eca\u5929\u4e5f\u8981\u4f86\u7532\u4fbf\u7576"
  };

  const avatarOptions = [
    { value: "dog", label: "LAI &#23567;&#29399;&#24215;&#21729;", meta: "&#24050;&#22871;&#29992;", icon: "dog" },
    { value: "bear", label: "&#35987;&#24215;&#38263;", meta: "&#38936;&#23566;&#21147; +5", icon: "bear" },
    { value: "rabbit", label: "&#33756;&#22290;&#20820;", meta: "&#39135;&#26448;&#40670;&#25976; +3", icon: "rabbit" },
    { value: "sheep", label: "&#27963;&#21205;&#32650;", meta: "&#27963;&#21205;&#35299;&#37782;", icon: "sheep", locked: true },
    { value: "chef", label: "&#24282;&#24107;&#38463;&#33756;", meta: "&#20219;&#21209;&#29554;&#24471;", icon: "chef" },
    { value: "fox", label: "&#26612;&#29356;&#38957;", meta: "&#21830;&#22478;", icon: "fox", locked: true }
  ];

  const frameOptions = [
    { value: "gold", label: "VIP &#37329;&#33394;&#26694;", meta: "&#24050;&#25317;&#26377;", icon: "gold" },
    { value: "leaf", label: "&#20581;&#24247;&#39184;&#26694;", meta: "&#20581;&#24247;&#39184; 7 &#27425;", icon: "leaf" },
    { value: "checkin", label: "&#31805;&#21040;&#28779;&#33457;&#26694;", meta: "&#36899;&#32196; 15 &#22825;", icon: "checkin" },
    { value: "crown", label: "&#20415;&#30070;&#29579;&#20896;&#26694;", meta: "&#25490;&#34892;&#27036;&#21069; 3", icon: "crown", locked: true },
    { value: "flower", label: "&#33457;&#22290;&#26085;&#26706;", meta: "&#27963;&#21205;", icon: "leaf" },
    { value: "newyear", label: "&#26032;&#24180;&#36196;&#26694;", meta: "&#38480;&#23450;", icon: "checkin", locked: true }
  ];

  const titleOptions = [
    { value: "\u4fbf\u7576\u738b", label: "&#20415;&#30070;&#29579;" },
    { value: "\u96de\u817f\u72c2\u4eba", label: "&#38622;&#33151;&#29378;&#20154;" },
    { value: "\u5065\u5eb7\u9054\u4eba", label: "&#20581;&#24247;&#36948;&#20154;" },
    { value: "\u9023\u7e8c\u7c3d\u5230 15 \u5929", label: "&#36899;&#32196;&#31805;&#21040; 15 &#22825;" },
    { value: "\u5275\u59cb\u6703\u54e1", label: "&#21109;&#22987;&#26371;&#21729;" },
    { value: "\u795e\u79d8\u98df\u5ba2", label: "&#31070;&#31192;&#39135;&#23458;", locked: true }
  ];

  const uniformOptions = [
    { value: "staff", label: "LAI &#24215;&#21729;&#26381;", meta: "&#20351;&#29992;&#20013;", icon: "staff" },
    { value: "chef", label: "&#24282;&#24107;&#21046;&#26381;", meta: "&#20219;&#21209;&#29554;&#24471;", icon: "chef" },
    { value: "summer", label: "&#22799;&#26085;&#21046;&#26381;", meta: "&#27963;&#21205;&#29554;&#24471;", icon: "summer" },
    { value: "delivery", label: "&#36939;&#21205;&#22806;&#22871;", meta: "&#21830;&#22478;&#20812;&#25563;", icon: "delivery" },
    { value: "festival", label: "&#26032;&#24180;&#21644;&#26381;", meta: "&#38480;&#23450;", icon: "festival", locked: true },
    { value: "secret", label: "&#26410;&#35299;&#37782;", meta: "???", icon: "locked", locked: true }
  ];

  const badgeOptions = [
    { value: "gold", label: "&#20415;&#30070;&#29579;", meta: "&#20351;&#29992;&#20013;", icon: "gold" },
    { value: "healthy", label: "&#20581;&#24247;&#36948;&#20154;", meta: "&#20581;&#24247;&#39184; 7 &#27425;", icon: "healthy" },
    { value: "spicy", label: "&#36914;&#25802;&#36948;&#20154;", meta: "&#20219;&#21209;&#29554;&#24471;", icon: "spicy" },
    { value: "social", label: "&#31038;&#32676;&#36948;&#20154;", meta: "&#30332;&#25991; 10 &#27425;", icon: "social" },
    { value: "checkin", label: "&#25171;&#21345;&#36948;&#20154;", meta: "&#36899;&#32196;&#31805;&#21040;", icon: "checkin" },
    { value: "hidden", label: "&#38577;&#34255;&#24494;&#31456;", meta: "&#26410;&#35299;&#37782;", icon: "hidden", locked: true }
  ];

  const backgroundOptions = [
    { value: "shop", label: "LAI &#23567;&#39184;&#26700;", meta: "&#20351;&#29992;&#20013;", icon: "shop" },
    { value: "beach", label: "&#28023;&#36942;&#39184;&#26700;", meta: "&#31232;&#26377;", icon: "beach" },
    { value: "sakura", label: "&#27185;&#33457;&#24237;&#22290;", meta: "&#27963;&#21205;", icon: "sakura" },
    { value: "forest", label: "&#26862;&#26519;&#23567;&#23627;", meta: "&#20219;&#21209;", icon: "forest" },
    { value: "night", label: "&#22812;&#26202;&#26143;&#31354;", meta: "&#38480;&#23450;", icon: "night", locked: true },
    { value: "secret", label: "&#31070;&#31192;&#22580;&#26223;", meta: "&#26410;&#35299;&#37782;", icon: "secret", locked: true }
  ];

  const obtainMethods = [
    ["&#27963;&#21205;&#29554;&#24471;", "&#21443;&#33287;&#38480;&#26178;&#27963;&#21205;&#38936;&#21462;&#35037;&#25198;&#29518;&#21237;", "events"],
    ["&#20219;&#21209;&#29554;&#24471;", "&#23436;&#25104;&#25351;&#23450;&#20219;&#21209;&#35299;&#37782;&#31281;&#34399;&#33287;&#24494;&#31456;", "tasks"],
    ["&#21830;&#22478;&#36092;&#36023;", "&#20351;&#29992;&#37329;&#24163;&#25110;&#40670;&#21048;&#20812;&#25563;&#22806;&#35264;", "shop"],
    ["&#31038;&#32676;&#25104;&#23601;", "&#30332;&#25991;&#12289;&#36865;&#31150;&#12289;&#36992;&#35531;&#22909;&#21451;&#29554;&#24471;", "community"]
  ];

  function cardGrid(items) {
    return `<div class="life-modal-grid">${items.join("")}</div>`;
  }

  function profileChoice(kind, option) {
    const selected = profile[kind] === option.value;
    const icon = kind === "frame"
      ? `<i class="life-frame-swatch ${esc(option.icon)}"></i>`
      : `<i class="life-mini-avatar ${esc(option.icon || "dog")}"></i>`;
    return `<button class="life-choice-card ${selected ? "selected" : ""} ${option.locked ? "locked" : ""}" data-life-action="equip" data-profile-kind="${esc(kind)}" data-profile-value="${esc(option.value)}" data-profile-locked="${option.locked ? "true" : "false"}">${icon}<strong>${option.label}</strong><small>${option.locked ? "&#26410;&#35299;&#37782;" : option.meta}</small></button>`;
  }

  function profileTitleOption(option) {
    const selected = profile.title === option.value;
    return `<button class="${selected ? "selected" : ""} ${option.locked ? "locked" : ""}" data-life-action="equip" data-profile-kind="title" data-profile-value="${esc(option.value)}" data-profile-locked="${option.locked ? "true" : "false"}">${option.label}</button>`;
  }

  function cosmeticChoice(kind, option) {
    const selected = profile[kind] === option.value;
    return `<button class="life-outfit-item ${selected ? "selected" : ""} ${option.locked ? "locked" : ""}" data-life-action="equip" data-cosmetic-kind="${esc(kind)}" data-cosmetic-value="${esc(option.value)}" data-profile-locked="${option.locked ? "true" : "false"}"><i class="life-cosmetic-icon ${esc(kind)}-${esc(option.icon)}"></i><strong>${option.label}</strong><small>${option.locked ? "&#26410;&#35299;&#37782;" : option.meta}</small></button>`;
  }

  function outfitPanel(number, titleText, content, extraClass = "") {
    return `<section class="life-outfit-panel ${extraClass}"><header><b>${number}</b><strong>${titleText}</strong></header>${content}</section>`;
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
    modal.classList.remove("life-modal-page", "life-modal-drawer", "life-modal-wide");
    if (view.type) modal.classList.add(`life-modal-${view.type}`);
    if (view.wide) modal.classList.add("life-modal-wide");
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

  function syncProfile() {
    const cards = document.querySelectorAll(".life-avatar");
    cards.forEach(avatar => {
      avatar.classList.remove("dog", "bear", "rabbit", "sheep", "chef", "fox", "frame-gold", "frame-leaf", "frame-checkin", "frame-crown", "frame-flower", "frame-newyear");
      avatar.classList.add(profile.avatar, `frame-${profile.frame}`);
    });
    document.querySelectorAll(".life-profile-card p").forEach(item => {
      item.textContent = `\u65e9\u5b89\uff0c ${profile.name}`;
    });
    document.querySelectorAll(".life-profile-card h1").forEach(item => {
      item.textContent = `Lv.27 ${profile.title}`;
    });
  }

  const rankingNames = {
    bento: "便當王排行",
    gift: "送禮王排行",
    invite: "邀請王排行",
    healthy: "健康王排行",
    checkin: "打卡王排行",
    share: "分享王排行"
  };

  function tabs(items) {
    return `<div class="life-tabs">${items.map((item, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${esc(item)}</button>`).join("")}</div>`;
  }

  function progressBar(value, label = "") {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 50;
    return `<div class="life-progress"><i style="width:${safeValue}%"></i><span>${esc(label || `${safeValue}%`)}</span></div>`;
  }

  function statPills(items) {
    return `<div class="life-pill-row">${items.map(item => `<span>${esc(item)}</span>`).join("")}</div>`;
  }

  const views = {
    memberProfile: {
      title: "\u6703\u54e1\u8cc7\u6599",
      kicker: "PROFILE",
      wide: true,
      render: () => `
        <section class="life-member-editor">
          <div class="life-member-editor-hero">
            <div class="life-profile-avatar-stage">
              <div class="life-avatar big ${esc(profile.avatar)} frame-${esc(profile.frame)}"><span></span></div>
              <b>VIP3</b>
            </div>
            <div>
              <span>VIP3&#65372;Lv.27&#65372;${esc(profile.title)}</span>
              <h3>${esc(profile.name)}</h3>
              <p>&#31281;&#34399;&#65306;${esc(profile.title)}</p>
              ${progressBar(51, "1280 / 2500 EXP")}
            </div>
          </div>
          <div class="life-profile-form">
            <label>&#39023;&#31034;&#21517;&#31281;<input data-profile-name value="${esc(profile.name)}" maxlength="16"></label>
            <label>&#20491;&#20154;&#23459;&#35328;<input data-profile-declaration value="${esc(profile.declaration)}" maxlength="24"></label>
          </div>
          <div class="life-wallet-grid">
            <article><i class="life-coin-icon"></i><span>&#37329;&#24163;</span><strong>${fmt(data.wallet.coins)}</strong></article>
            <article><i class="life-ticket-icon"></i><span>&#40670;&#21048; / &#31150;&#21048;</span><strong>${fmt(data.wallet.tickets)}</strong></article>
            <article><i class="life-heart-icon"></i><span>&#39636;&#21147;</span><strong>${data.wallet.hearts}/${data.wallet.maxHearts}</strong></article>
            <article><i class="life-leaf-icon"></i><span>&#39135;&#26448;&#40670;&#25976;</span><strong>320</strong></article>
          </div>
          <div class="life-custom-section">
            <header><strong>&#38957;&#20687;&#39080;&#26684;</strong><span>&#36984;&#25799;&#20320;&#22312;&#20415;&#30070;&#23567;&#37806;&#30340;&#35282;&#33394;</span></header>
            <div class="life-choice-grid">
              ${avatarOptions.map(option => profileChoice("avatar", option)).join("")}
            </div>
          </div>
          <div class="life-custom-section">
            <header><strong>&#38957;&#20687;&#26694;</strong><span>&#23637;&#31034; VIP&#12289;&#31805;&#21040;&#33287;&#20581;&#24247;&#25104;&#23601;</span></header>
            <div class="life-choice-grid">
              ${frameOptions.map(option => profileChoice("frame", option)).join("")}
            </div>
          </div>
          <div class="life-custom-section">
            <header><strong>&#31281;&#34399;</strong><span>&#21029;&#20154;&#30475;&#24471;&#21040;&#30340;&#20491;&#20154;&#27161;&#31844;</span></header>
            <div class="life-title-rack">
              ${titleOptions.map(profileTitleOption).join("")}
            </div>
          </div>
          <div class="life-member-actions">
            <button data-life-action="saveProfile">&#20786;&#23384;&#36039;&#26009;</button>
            <button data-life-open="outfit">&#36914;&#20837;&#35037;&#25198;</button>
            <button data-life-open="coupons">&#26597;&#30475;&#40670;&#21048;</button>
          </div>
        </section>
      `
    },

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

  Object.assign(views, {
    orders: {
      title: "訂單",
      kicker: "ORDER PAGE",
      type: "page",
      render: () => {
        const meals = [
          ["舒肥雞胸健康餐", "$120", "645 kcal", "55g", "18"],
          ["香煎雞腿排健康餐", "$150", "705 kcal", "48g", "12"],
          ["招牌控肉便當", "$120", "781 kcal", "31g", "22"],
          ["川味口水雞便當", "$120", "721 kcal", "40g", "15"],
          ["香煎鮭魚健康餐", "$200", "690 kcal", "46g", "8"]
        ];
        return `
          <section class="life-page-hero">
            <div><span>TODAY SPECIAL</span><h3>今日推薦：香煎雞腿排健康餐</h3><p>去骨雞腿排、五穀飯、固定配菜，適合午餐高峰快速出餐。</p></div>
            <img src="assets/lai-bento-hero.png" alt="">
          </section>
          <section class="life-order-layout">
            <div class="life-product-grid">${meals.map((meal, index) => `
              <article class="life-product-card">
                <img src="assets/lai-bento-hero.png" alt="">
                <span>庫存 ${meal[4]}</span>
                <h3>${meal[0]}</h3>
                ${statPills([meal[2], `蛋白質 ${meal[3]}`, meal[1]])}
                <label>數量 <input type="number" min="1" value="${index === 0 ? 1 : 0}"></label>
                <label>配菜 <select><option>固定配菜</option><option>加青花菜</option><option>少飯多菜</option></select></label>
                <button data-life-action="addCart">加入購物車</button>
              </article>
            `).join("")}</div>
            <aside class="life-checkout-panel">
              <h3>購物車</h3>
              <p>香煎雞腿排健康餐 x1</p>
              <label><input type="checkbox"> 使用滷蛋券</label>
              <label><input type="checkbox"> 點數折抵 50 金幣</label>
              <b>小計 $150</b>
              <button data-life-action="checkout">結帳</button>
              ${list(["製作中：LAI-20260704-009", "配送中：LAI-20260704-006", "已完成：LAI-20260703-086"].map(item => `<article class="life-mini-row">${esc(item)}</article>`))}
            </aside>
          </section>`;
      }
    },
    notifications: {
      title: "消息中心",
      kicker: "MESSAGE CENTER",
      wide: true,
      render: () => {
        const groups = ["系統通知", "好友消息", "禮物通知", "訂單通知", "活動通知"];
        const messages = [
          ["系統", "會員點數已更新", "消費紀錄完成同步，點數 +150。", "剛剛", "未讀"],
          ["好友", "Amy 傳來訊息", "等等一起開團訂便當嗎？", "5 分鐘前", "未讀"],
          ["禮物", "王小明送你禮物", "收到 50 金幣禮包。", "12 分鐘前", "已讀"],
          ["訂單", "訂單製作中", "LAI-20260704-009 已進入廚房。", "20 分鐘前", "已讀"],
          ["活動", "夏日南瓜季開始", "完成 7 天任務可拿限定桌布。", "今天", "未讀"]
        ];
        return `${tabs(groups)}${list(messages.map(msg => `<article class="life-message-card ${msg[4] === "未讀" ? "unread" : ""}"><b>${msg[0]}</b><div><strong>${msg[1]}</strong><p>${msg[2]}</p></div><span>${msg[3]}｜${msg[4]}</span><button data-life-action="readNotice">查看</button></article>`))}`;
      }
    },
    events: {
      title: "活動中心",
      kicker: "EVENT CENTER",
      wide: true,
      render: () => `
        <section class="life-page-hero"><div><span>LIMITED EVENT</span><h3>夏日南瓜季</h3><p>每日訂購健康餐、分享照片、邀請好友，解鎖限定餐盒與桌布。</p></div></section>
        ${tabs(["每日活動", "每週活動", "節日活動", "團購活動"])}
        ${cardGrid(data.events.concat([
          { name: "午餐尖峰挑戰", progress: "12/20 份", reward: "加菜券 x2" },
          { name: "企業團購日", progress: "28/50 份", reward: "企業團購券" }
        ]).map(event => `<article class="life-modal-card"><span>${esc(event.progress)}</span><strong>${esc(event.name)}</strong>${progressBar(Number(event.progress) || 56, event.progress)}<p>獎勵：${esc(event.reward)}</p><button data-life-action="joinEvent">立即參加</button></article>`))}
      `
    },
    tasks: {
      title: "任務中心",
      kicker: "TASK CENTER",
      wide: true,
      render: () => {
        const taskSets = ["每日任務", "每週任務", "新手任務", "成就任務"];
        const tasks = data.tasks.concat([
          { label: "連續簽到 7 天", reward: "+80 金幣 +50 EXP", done: false },
          { label: "完成第一次送禮", reward: "+5 禮券", done: false },
          { label: "收藏 5 種便當", reward: "收藏徽章", done: true }
        ]);
        return `${tabs(taskSets)}${list(tasks.map((task, index) => `<article class="life-task-row"><div><strong>${esc(task.label)}</strong><p>完成指定行為即可獲得獎勵。</p>${progressBar(task.done ? 100 : [35, 60, 20, 80][index % 4], task.done ? "完成" : "進行中")}</div><span>${esc(task.reward)}</span><button data-life-open="${index % 2 ? "orders" : "map"}">前往</button><button data-life-action="claimTasks">領取</button></article>`))}`;
      }
    },
    map: {
      title: "LAI便當小鎮地圖",
      kicker: "TOWN MAP PAGE",
      type: "page",
      render: () => {
        const places = [
          ["LAI便當店", "orders", "訂便當、查訂單"],
          ["小菜園", "garden", "收成配菜"],
          ["排行榜廣場", "rankings", "每週榜單"],
          ["好友廣場", "friends", "送禮打招呼"],
          ["禮物郵箱", "gifts", "收送禮物"],
          ["商城攤位", "shop", "兌換商品"],
          ["我的餐桌", "table", "佈置展示"],
          ["企業團購區", "community", "社群與團購"]
        ];
        return `<div class="life-town-map">${places.map(place => `<button data-life-open="${place[1]}"><strong>${place[0]}</strong><span>${place[2]}</span></button>`).join("")}</div>`;
      }
    },
    menu: {
      title: "選單",
      kicker: "MENU DRAWER",
      type: "drawer",
      render: () => list(["會員資料", "設定", "客服中心", "優惠券", "訂單紀錄", "邀請好友", "常見問題", "登出"].map((item, index) => `<article class="life-drawer-item"><strong>${item}</strong><span>${index === 0 ? "Yu Zi｜Gold VIP｜Lv.27" : "查看與管理"}</span><button data-life-open="${["resources", "notifications", "chat", "coupons", "orders", "invite", "notifications", "menu"][index]}">進入</button></article>`))
    },
    game: {
      title: "遊戲屋",
      kicker: "GAME HOUSE",
      wide: true,
      render: () => {
        const games = [["每日轉盤", "1 次", "20 金幣", "最高 200 金幣"], ["刮刮卡", "3 次", "1 禮券", "折價券 / 加菜券"], ["配菜挑戰", "2 次", "10 金幣", "配菜券"], ["便當記憶翻牌", "5 次", "愛心 1", "經驗值"]];
        return `${cardGrid(games.map(game => `<article class="life-modal-card"><span>${game[1]}</span><strong>${game[0]}</strong><p>消耗：${game[2]}</p><p>可能獎勵：${game[3]}</p><button data-life-action="playGame">開始遊戲</button></article>`))}<h3>獎勵紀錄</h3>${list(["轉盤獲得 50 金幣", "刮刮卡獲得滷蛋券", "翻牌獲得 30 EXP"].map(item => `<article class="life-mini-row">${item}</article>`))}`;
      }
    },
    rankings: {
      title: "排行榜",
      kicker: "WEEKLY RANK",
      wide: true,
      render: () => `${tabs(Object.values(rankingNames))}<p class="life-modal-note">每週重置倒數：2 天 08:36。我的排名固定顯示於下方。</p>${Object.entries(data.rankings).map(([key, rows]) => `<section class="life-rank-section"><h3>${rankingNames[key]}</h3><ol>${rows.map((row, index) => `<li class="${index < 3 ? "top" : ""}"><span>${index + 1}</span><i class="life-rank-avatar"></i><strong>${esc(row[0])}<small>${index === 0 ? "傳奇食客" : "便當夥伴"}</small></strong><b>${esc(row[1])}</b></li>`).join("")}</ol><div class="life-my-rank">我的排名：#4 Yu Zi｜728 份</div></section>`).join("")}`
    },
    gifts: {
      title: "禮物中心",
      kicker: "GIFT CENTER",
      wide: true,
      render: () => `${tabs(["可送禮物", "收到的禮物", "已送出的禮物"])}<p class="life-modal-note">每日送禮上限 3 次，今日剩餘 2 次。</p><div class="life-search-line"><input placeholder="選擇好友：Amy / Kevin / 王小明"><button data-life-action="sendGift">送出</button></div>${cardGrid(data.gifts.concat([{ name: "限定小物", cost: 50, stock: 1 }]).map(gift => `<article class="life-modal-card"><span>庫存 ${gift.stock}</span><strong>${gift.name}</strong><p>消耗 ${gift.cost} 金幣</p><button data-life-action="sendGift">送禮</button></article>`))}<h3>禮物紀錄</h3>${list(["收到：王小明送 50 金幣", "送出：Amy 飲料券", "收到：Kevin 加菜券"].map(item => `<article class="life-mini-row">${item}</article>`))}`
    },
    collection: {
      title: "收藏冊",
      kicker: "COLLECTION PAGE",
      type: "page",
      render: () => `${tabs(["便當圖鑑", "食材圖鑑", "徽章圖鑑", "限定活動收藏"])}<p class="life-modal-note">集滿系列可領取限定徽章與餐桌裝飾。</p>${cardGrid(data.collection.concat([{ name: "青花菜", rarity: "食材", unlocked: true }, { name: "創始會員徽章", rarity: "稀有", unlocked: false }, { name: "南瓜季餐盒", rarity: "季節限定", unlocked: false }]).map(item => `<article class="life-modal-card ${item.unlocked ? "" : "locked"}"><span>${item.rarity}</span><strong>${item.unlocked ? item.name : "未解鎖"}</strong><p>${item.unlocked ? "已解鎖，可展示。" : "完成指定活動後解鎖。"}</p></article>`))}`
    },
    shop: {
      title: "商城",
      kicker: "POINT SHOP",
      wide: true,
      render: () => `${tabs(["優惠券", "加菜券", "裝飾品", "頭像框", "限定周邊", "企業團購券"])}${cardGrid(data.shop.concat([{ name: "企業團購 95 折券", price: "1500 金幣", stock: "剩 8" }, { name: "限定餐盒", price: "2200 金幣", stock: "剩 3" }]).map(item => `<article class="life-product-card"><div class="life-shop-image"></div><span>${item.stock}</span><h3>${item.name}</h3><p>${item.price}</p><button data-life-action="redeemShop">兌換</button></article>`))}`
    },
    pass: {
      title: "便當通行證",
      kicker: "BATTLE PASS",
      wide: true,
      render: () => `<section class="life-pass-head"><h3>Lv.8 / 30</h3>${progressBar(42, "1280 / 3000 EXP")}<button data-life-action="claimTasks">一鍵領取</button><button data-life-action="redeemShop">升級高級通行證</button></section>${tabs(["免費獎勵線", "付費獎勵線"])}<div class="life-pass-track">${Array.from({ length: 10 }, (_, i) => `<article><b>Lv.${i + 1}</b><span>${i % 2 ? "禮券" : "金幣"}</span></article>`).join("")}</div>`
    },
    chat: {
      title: "聊天系統",
      kicker: "CHAT DRAWER",
      type: "drawer",
      render: () => `${tabs(["世界聊天", "好友聊天", "社群聊天"])}${list(data.chats.map((chat, index) => `<article class="life-chat-row"><span>${chat.room}｜未讀 ${index === 0 ? 3 : 0}</span><strong>${chat.user}</strong><p>${chat.text}</p><small>12:${10 + index}</small></article>`))}<form class="life-message-box" data-life-message><input placeholder="輸入訊息或表情"><button>送出</button></form>`
    },
    friends: {
      title: "好友系統",
      kicker: "FRIENDS",
      wide: true,
      render: () => `<div class="life-copy-box"><code>邀請碼 LAI-8W91</code><button data-life-action="copyInvite">分享邀請連結</button></div><div class="life-search-line"><input placeholder="搜尋好友姓名 / 手機 / 邀請碼"><button data-life-action="addFriend">搜尋</button></div>${list(data.friends.map(friend => `<article class="life-modal-row"><b>${friend.status}</b><strong>${friend.name}</strong><span>最近吃：${friend.lastMeal}｜${friend.note}</span><button data-life-open="gifts">送禮</button><button data-life-action="greetFriend">打招呼</button><button data-life-action="removeFriend">移除</button></article>`))}`
    },
    community: {
      title: "社群廣場",
      kicker: "COMMUNITY PAGE",
      type: "page",
      render: () => `<button class="life-wide-button" data-life-action="newPost">發布便當照片</button>${tabs(["今日熱門", "最新貼文", "控肉", "健康餐", "雞腿", "鯖魚"])}${list(data.posts.map(post => `<article class="life-post-card"><strong>${post.user}｜${post.meal}</strong><p>${"★".repeat(post.rating)} ${post.text}</p><span>${post.likes} 愛心｜留言｜分享｜#健康餐</span></article>`))}`
    },
    table: {
      title: "我的餐桌",
      kicker: "MY TABLE PAGE",
      type: "page",
      render: () => `<div class="life-table-preview"><span></span><b>個人展示空間</b></div>${tabs(["桌子", "便當", "植物", "公仔", "背景"])}${cardGrid(data.table.decorations.map(item => `<article class="life-modal-card"><strong>${item}</strong><p>拖曳擺放、儲存佈置、分享截圖。</p><button data-life-action="decorate">擺放</button></article>`))}<button class="life-wide-button" data-life-action="decorate">儲存佈置</button>`
    },
    bag: {
      title: "背包",
      kicker: "INVENTORY",
      wide: true,
      render: () => `${tabs(["道具", "禮券", "裝飾品", "食材", "徽章", "任務物品"])}${cardGrid(data.bag.map(item => `<article class="life-modal-card"><span>${item.type}</span><strong>${item.name}</strong><p>數量：1｜稀有度：普通</p><button data-life-action="useItem">使用</button></article>`))}`
    },
    outfit: {
      title: "\u88dd\u626e\u7cfb\u7d71\u7e3d\u89bd",
      kicker: "OUTFIT",
      wide: true,
      render: () => `
        <section class="life-outfit-system">
          ${outfitPanel("01", "&#35037;&#25198;&#31995;&#32113;&#20027;&#38913;", `
            <div class="life-outfit-home">
              <div class="life-outfit-tabs"><span>&#38957;&#20687;</span><span>&#38957;&#20687;&#26694;</span><span>&#31281;&#34399;</span><span>&#21046;&#26381;</span><span>&#24494;&#31456;</span><span>&#26700;&#24067;&#32972;&#26223;</span></div>
              <div class="life-outfit-hero-card">
                <div class="life-outfit-character ${esc(profile.uniform)}"><div class="life-avatar ${esc(profile.avatar)} frame-${esc(profile.frame)}"><span></span></div><i></i></div>
                <div>
                  <h3>${esc(profile.name)}</h3>
                  <p><b>${esc(profile.title)}</b></p>
                  ${progressBar(51, "Lv.27  1280 / 2500")}
                </div>
              </div>
              <div class="life-outfit-equipped">
                <article><i class="life-frame-swatch ${esc(profile.frame)}"></i><strong>&#21109;&#22987;&#26371;&#21729;&#38957;&#20687;&#26694;</strong><button data-life-action="equip">&#22871;&#29992;</button></article>
                <article><i class="life-cosmetic-icon badge-${esc(profile.badge)}"></i><strong>${esc(profile.title)} &#31281;&#34399;</strong><button data-life-action="equip">&#22871;&#29992;</button></article>
                <article><i class="life-cosmetic-icon uniform-${esc(profile.uniform)}"></i><strong>LAI &#24215;&#21729;&#24125;</strong><button data-life-action="equip">&#22871;&#29992;</button></article>
                <article><i class="life-cosmetic-icon badge-healthy"></i><strong>&#20581;&#24247;&#36948;&#20154;&#24494;&#31456;</strong><button class="disabled" type="button">&#26410;&#35299;&#37782;</button></article>
              </div>
            </div>
          `, "home")}
          ${outfitPanel("02", "&#38957;&#20687;", `<div class="life-outfit-filter"><span>&#20840;&#37096;</span><span>&#22522;&#30990;</span><span>&#27963;&#21205;</span><span>&#38480;&#23450;</span></div><div class="life-outfit-grid avatar-grid">${avatarOptions.map(option => profileChoice("avatar", option)).join("")}</div><div class="life-page-dots">1/3</div>`)}
          ${outfitPanel("03", "&#38957;&#20687;&#26694;", `<div class="life-outfit-filter"><span>&#20840;&#37096;</span><span>&#19968;&#33324;</span><span>&#31232;&#26377;</span><span>&#38480;&#23450;</span></div><div class="life-outfit-grid">${frameOptions.map(option => profileChoice("frame", option)).join("")}</div><div class="life-page-dots">1/4</div>`)}
          ${outfitPanel("04", "&#31281;&#34399;", `<div class="life-title-board"><aside><span>&#20840;&#37096;</span><span>&#19968;&#33324;</span><span>&#31232;&#26377;</span><span>&#21490;&#35433;</span><span>&#27963;&#21205;</span></aside><div class="life-title-rack outfit-title">${titleOptions.map(profileTitleOption).join("")}</div></div>`)}
          ${outfitPanel("05", "&#21046;&#26381;", `<div class="life-outfit-filter"><span>&#20840;&#37096;</span><span>&#19968;&#33324;</span><span>&#31232;&#26377;</span><span>&#38480;&#23450;</span></div><div class="life-outfit-grid">${uniformOptions.map(option => cosmeticChoice("uniform", option)).join("")}</div><div class="life-page-dots">1/3</div>`)}
          ${outfitPanel("06", "&#24494;&#31456;", `<div class="life-outfit-filter"><span>&#20840;&#37096;</span><span>&#19968;&#33324;</span><span>&#31232;&#26377;</span><span>&#27963;&#21205;</span></div><div class="life-outfit-grid">${badgeOptions.map(option => cosmeticChoice("badge", option)).join("")}</div><div class="life-page-dots">1/3</div>`)}
          ${outfitPanel("07", "&#26700;&#24067;&#32972;&#26223;", `<div class="life-outfit-filter"><span>&#20840;&#37096;</span><span>&#19968;&#33324;</span><span>&#31232;&#26377;</span><span>&#38480;&#23450;</span></div><div class="life-bg-grid">${backgroundOptions.map(option => cosmeticChoice("background", option)).join("")}</div>`)}
          ${outfitPanel("08", "&#31359;&#25140;&#38928;&#35261;", `<div class="life-wear-preview ${esc(profile.background)}"><div class="life-outfit-character ${esc(profile.uniform)}"><div class="life-avatar ${esc(profile.avatar)} frame-${esc(profile.frame)}"><span></span></div><i></i></div><button data-life-action="saveProfile">&#20786;&#23384;&#25645;&#37197;</button></div><dl class="life-current-fit"><div><dt>&#38957;&#20687;</dt><dd>${avatarOptions.find(item => item.value === profile.avatar)?.label || "LAI"}</dd></div><div><dt>&#38957;&#20687;&#26694;</dt><dd>${frameOptions.find(item => item.value === profile.frame)?.label || "VIP"}</dd></div><div><dt>&#31281;&#34399;</dt><dd>${esc(profile.title)}</dd></div><div><dt>&#21046;&#26381;</dt><dd>${uniformOptions.find(item => item.value === profile.uniform)?.label || "LAI"}</dd></div><div><dt>&#24494;&#31456;</dt><dd>${badgeOptions.find(item => item.value === profile.badge)?.label || "VIP"}</dd></div></dl>`)}
          ${outfitPanel("09", "&#29554;&#21462;&#26041;&#24335;", `<div class="life-obtain-list">${obtainMethods.map(item => `<article><i></i><div><strong>${item[0]}</strong><p>${item[1]}</p></div><button data-life-open="${item[2]}">&#21069;&#24448;</button></article>`).join("")}</div>`)}
          <section class="life-outfit-actions"><strong>10 &#24555;&#36895;&#25805;&#20316;</strong><button data-life-action="equip">&#19968;&#37749;&#22871;&#29992;</button><button data-life-action="saveProfile">&#38568;&#26178;&#20786;&#23384;</button><button data-life-open="shop">&#25512;&#34214;&#26041;&#26696;</button><button data-life-open="friends">&#20998;&#20139;&#25645;&#37197;</button></section>
        </section>
      `
    },
    checkin: {
      title: "每日簽到",
      kicker: "CHECK IN",
      wide: true,
      render: () => `<section class="life-page-hero"><div><span>連續 ${data.signIn.streak} 天</span><h3>今日獎勵：${data.signIn.todayReward}</h3><p>可使用補簽券補回中斷天數。</p></div><button data-life-action="checkin">簽到</button></section><h3>7 日獎勵表</h3><div class="life-signin-week">${data.signIn.week.map(day => `<span class="${day.claimed ? "done" : ""}"><b>D${day.day}</b>${day.reward}</span>`).join("")}</div><h3>30 日獎勵表</h3><div class="life-pass-track">${Array.from({ length: 30 }, (_, i) => `<article><b>${i + 1}</b><span>${i % 5 === 0 ? "禮券" : "金幣"}</span></article>`).join("")}</div>`
    },
    invite: {
      title: "邀請好友",
      kicker: "INVITE",
      wide: true,
      render: () => `<section class="life-page-hero"><div><span>我的邀請碼</span><h3>LAI-8W91</h3><p>朋友註冊 +100，首次消費雙方再 +500。</p></div><div class="life-qr-box">QR</div></section><div class="life-copy-box"><code>https://lai.app/invite/LAI-8W91</code><button data-life-action="copyInvite">複製分享連結</button></div>${cardGrid([infoCard("邀請成功", "18 人", "累積"), infoCard("首購獎勵", "9 人已完成", "雙方獎勵"), infoCard("邀請排行榜", "#3", "本週")])}`
    },
    todayRecommendation: {
      title: "今日推薦",
      kicker: "TODAY RECOMMENDATION",
      wide: true,
      render: () => `<section class="life-page-hero"><div><span>便當餐車推薦</span><h3>香煎雞腿排健康餐</h3><p>705 kcal｜蛋白質 48g｜今日餐車庫存 12 份。</p></div><img src="assets/lai-bento-hero.png" alt=""></section>${cardGrid([infoCard("推薦理由", "去骨雞腿排，外皮香煎，搭配五穀飯與固定配菜。", "熱銷"), infoCard("營養標示", "碳水 50g｜脂肪 28g｜鈉 720mg", "每份"), `<article class="life-modal-card accent"><strong>加入今日餐車訂單</strong><p>可直接帶入訂購頁。</p><button data-life-open="orders">去訂便當</button></article>`])}`
    },
    groupOrder: {
      title: "企業團購區",
      kicker: "GROUP ORDER PAGE",
      type: "page",
      render: () => `<section class="life-page-hero"><div><span>企業訂餐</span><h3>公司團購任務</h3><p>湊滿 30 份享 95 折，50 份解鎖企業福利券。</p></div><button data-life-open="orders">建立團購</button></section>${cardGrid([infoCard("本月團購", "28 / 50 份", "進行中"), infoCard("企業福利券", "95 折券 x8", "可領取"), infoCard("團體排行榜", "#2 北屯健康隊", "本週")])}${list(["LAI-企業-001｜午餐團購｜28 份", "LAI-企業-002｜健身社群｜16 份", "LAI-企業-003｜學校社團｜12 份"].map(item => `<article class="life-mini-row">${item}</article>`))}`
    },
    explore: {
      title: "出門逛逛",
      kicker: "EXPLORE PAGE",
      type: "page",
      render: () => `<section class="life-page-hero"><div><span>生活圈地圖</span><h3>附近活動與好友出沒</h3><p>查看附近店家、團購點、活動會場與朋友正在吃什麼。</p></div></section>${cardGrid([infoCard("北屯", "Kevin 正在吃控肉便當", "5 分鐘前"), infoCard("西屯", "企業團購差 12 份成團", "團購點"), infoCard("南屯", "健康餐桌挑戰 48 人參加", "活動")])}${tabs(["附近活動", "團購點", "生活圈地圖", "好友出沒"])}`
    }
  });

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
    addCart: () => toast("已加入購物車。"),
    checkout: () => toast("訂單已送出，後台會收到 mock 訂單。"),
    sendGift: () => toast("已送出 mock 禮物。"),
    greetFriend: () => toast("已和好友打招呼，親密度 +1。"),
    removeFriend: () => toast("已移除好友。"),
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
    equip(event) {
      const target = event.target.closest("[data-profile-kind]");
      const cosmeticTarget = event.target.closest("[data-cosmetic-kind]");
      if (cosmeticTarget) {
        if (cosmeticTarget.dataset.profileLocked === "true") {
          toast("\u9019\u500b\u5916\u89c0\u9084\u6c92\u89e3\u9396\u3002");
          return;
        }
        const kind = cosmeticTarget.dataset.cosmeticKind;
        const value = cosmeticTarget.dataset.cosmeticValue;
        if (kind && value) profile[kind] = value;
        syncProfile();
        toast("\u5df2\u5957\u7528\u5916\u89c0\u8a2d\u5b9a\u3002");
        openModal("outfit");
        return;
      }
      if (!target) {
        toast("已套用裝扮。");
        return;
      }
      if (target.dataset.profileLocked === "true") {
        toast("\u9019\u500b\u5916\u89c0\u9084\u6c92\u89e3\u9396\u3002");
        return;
      }
      const kind = target.dataset.profileKind;
      const value = target.dataset.profileValue;
      if (kind && value) profile[kind] = value;
      syncProfile();
      toast("\u5df2\u5957\u7528\u5916\u89c0\u8a2d\u5b9a\u3002");
      openModal(target.closest(".life-member-editor") ? "memberProfile" : "outfit");
    },
    joinEvent: () => toast("已加入活動。"),
    trackOrder: () => toast("訂單追蹤已開啟。"),
    saveProfile() {
      const nameInput = body.querySelector("[data-profile-name]");
      const declarationInput = body.querySelector("[data-profile-declaration]");
      if (nameInput?.value.trim()) profile.name = nameInput.value.trim();
      if (declarationInput?.value.trim()) profile.declaration = declarationInput.value.trim();
      syncProfile();
      toast("\u6703\u54e1\u8cc7\u6599\u5df2\u5132\u5b58\u3002");
      openModal("memberProfile");
    },
    readNotice: event => event.target.closest(".life-modal-row")?.remove()
  };

  function initTownGame() {
    const canvas = document.querySelector("#lifeGame");
    if (!canvas) return;
    const hint = document.querySelector("#lifeInteractionHint");
    const hintTitle = document.querySelector("#lifeInteractionTitle");
    const hintText = document.querySelector("#lifeInteractionText");
    const hintButton = document.querySelector("#lifeInteractButton");

    if (window.LAI_PHASER_TOWN?.mount) {
      const mounted = window.LAI_PHASER_TOWN.mount({
        openModal,
        toast,
        updateHint(zone) {
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
      });
      if (mounted) {
        canvas.hidden = true;
        return;
      }
    }

    const ctx = canvas.getContext("2d");
    const world = { w: 1600, h: 1040 };
    const player = { x: 800, y: 690, w: 42, h: 56, speed: 220, moving: false, dir: "down" };
    const camera = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    const sceneImage = new Image();
    sceneImage.src = "assets/lai-life-town-bg.png";
    const keys = new Set();
    let moveTarget = null;
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

    function findWalkableTarget(point) {
      const base = {
        x: clamp(point.x, 42, world.w - 42),
        y: clamp(point.y, 70, world.h - 42)
      };
      if (canStand(base.x, base.y)) return base;
      const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
      for (let radius = 32; radius <= 180; radius += 24) {
        for (const angle of angles) {
          const candidate = {
            x: clamp(base.x + Math.cos(angle) * radius, 42, world.w - 42),
            y: clamp(base.y + Math.sin(angle) * radius, 70, world.h - 42)
          };
          if (canStand(candidate.x, candidate.y)) return candidate;
        }
      }
      return null;
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

    function drawSceneBackground() {
      if (!sceneImage.complete || !sceneImage.naturalWidth) {
        ctx.fillStyle = "#9fd7ee";
        ctx.fillRect(0, 0, world.w, world.h);
        ctx.fillStyle = colors.grass;
        ctx.fillRect(0, 0, world.w, world.h);
        return;
      }
      const imageRatio = sceneImage.naturalWidth / sceneImage.naturalHeight;
      const worldRatio = world.w / world.h;
      let dw = world.w;
      let dh = world.h;
      let dx = 0;
      let dy = 0;
      if (imageRatio > worldRatio) {
        dw = world.h * imageRatio;
        dx = (world.w - dw) / 2;
      } else {
        dh = world.w / imageRatio;
        dy = (world.h - dh) / 2;
      }
      ctx.drawImage(sceneImage, dx, dy, dw, dh);
      ctx.fillStyle = "rgba(255, 248, 218, 0.12)";
      ctx.fillRect(0, 0, world.w, world.h);
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

    function drawMoveTarget() {
      if (!moveTarget) return;
      ctx.strokeStyle = "rgba(255, 200, 79, 0.95)";
      ctx.fillStyle = "rgba(255, 248, 218, 0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(moveTarget.x, moveTarget.y - 8, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(moveTarget.x, moveTarget.y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawScene(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      drawSceneBackground();

      ctx.fillStyle = "#eac88d";
      ctx.beginPath();
      ctx.ellipse(800, 690, 600, 240, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,253,247,.45)";
      ctx.beginPath();
      ctx.ellipse(800, 690, 430, 145, 0, 0, Math.PI * 2);
      ctx.fill();

      drawRoundedRect(560, 120, 480, 230, 26, "rgba(255,243,214,.78)", "rgba(112,76,37,.2)");
      drawRoundedRect(602, 70, 396, 72, 28, "rgba(184,121,69,.82)", "rgba(112,76,37,.2)");
      drawRoundedRect(620, 142, 360, 58, 20, "rgba(255,216,102,.86)");
      ctx.fillStyle = colors.ink;
      ctx.font = "900 42px 'Noto Sans TC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LAI 便當", 800, 178);
      drawRoundedRect(735, 240, 130, 110, 16, "rgba(139,111,60,.7)");
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
      drawMoveTarget();
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
      let length = Math.hypot(vx, vy);
      if (length > 0.05) moveTarget = null;
      if (length <= 0.05 && moveTarget) {
        const dx = moveTarget.x - player.x;
        const dy = moveTarget.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 8) {
          moveTarget = null;
        } else {
          vx = dx / distance;
          vy = dy / distance;
          length = 1;
        }
      }
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
      if (npc) {
        moveTarget = null;
        data.currentNpc = npc;
        openModal("npcDialogue");
        return;
      }
      const destination = findWalkableTarget(point);
      if (!destination) {
        toast("這裡不能走，請點廣場或道路。");
        return;
      }
      moveTarget = destination;
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
  syncProfile();
  initTownGame();
})();
