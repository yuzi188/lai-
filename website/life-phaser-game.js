(function () {
  function mountLaiPhaserTown(options) {
    if (!window.Phaser) return false;

    const mount = document.querySelector("#lifePhaserMount");
    if (!mount) return false;
    mount.innerHTML = "";

    const openModal = options.openModal;
    const updateHint = options.updateHint;
    const toast = options.toast;
    const world = { width: 2400, height: 1600 };

    class LaiTownScene extends Phaser.Scene {
      constructor() {
        super("LaiTownScene");
        this.player = null;
        this.moveTarget = null;
        this.cursors = null;
        this.keys = null;
        this.interactions = [];
        this.npcs = [];
        this.activeInteraction = null;
        this.blockers = [];
      }

      preload() {
        this.load.image("townBg", "assets/lai-life-town-bg.png");
        this.load.spritesheet("characters", "assets/lai-life-characters-sheet.png", {
          frameWidth: 283,
          frameHeight: 793
        });
      }

      create() {
        this.cameras.main.setBackgroundColor("#9fd7ee");
        this.physics.world.setBounds(0, 0, world.width, world.height);
        this.drawTown();
        this.createPlayer();
        this.blockers.forEach(blocker => this.physics.add.collider(this.player, blocker));
        this.createNpcs();
        this.createInteractions();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D");
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setBounds(0, 0, world.width, world.height);
        this.applyResponsiveCamera();
        this.input.on("pointerdown", pointer => this.handlePointer(pointer));
        this.scale.on("resize", () => this.applyResponsiveCamera());
      }

      applyResponsiveCamera() {
        const width = this.scale.width || window.innerWidth;
        const height = this.scale.height || window.innerHeight;
        const isPortraitPhone = width <= 640 && height >= width;
        const isTablet = width <= 1100;
        const coverZoom = Math.max(width / world.width, height / world.height) * 1.04;
        const zoom = isPortraitPhone ? Math.max(coverZoom, 0.54) : isTablet ? Math.max(coverZoom, 0.46) : 0.72;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.setLerp(isPortraitPhone ? 0.08 : 0.12, isPortraitPhone ? 0.08 : 0.12);
        this.cameras.main.centerOn(this.player.x, this.player.y);
      }

      drawTown() {
        const bg = this.add.image(world.width / 2, world.height / 2, "townBg");
        bg.setDisplaySize(world.width, world.height).setAlpha(1);

        this.addZoneObstacle(1070, 770, 260, 170, "噴水池", 0x78b7c7, "circle");
        this.addBuilding(840, 150, 620, 360, "LAI 便當", 0xfff3d6, 0xffc84f);
        this.addBuilding(1560, 670, 300, 210, "便當餐車", 0xfff8da, 0x7fb86f);
        this.addBuilding(1580, 170, 500, 300, "小菜園", 0xf3e2bd, 0x7fb86f);
        this.addBuilding(470, 630, 300, 170, "任務看板", 0xfff8da, 0xb87945);
        this.addBuilding(450, 850, 320, 170, "排行榜", 0xfff8da, 0xffc84f);
        this.addBuilding(1660, 930, 220, 200, "禮物郵箱", 0xf06a55, 0xffc84f);
        this.addBuilding(1710, 1210, 300, 230, "商城攤位", 0xfff8da, 0xb87945);
        this.addBuilding(640, 1190, 330, 220, "我的餐桌", 0xfff8da, 0x8b6f3c);
        this.addBuilding(1080, 1210, 360, 240, "企業團購", 0xe8eef6, 0x7fb86f);
        this.addBuilding(260, 1180, 260, 190, "巴士站", 0xf7d37c, 0x64a6df);

        for (let i = 0; i < 26; i += 1) this.addTree(90 + i * 86, 92 + (i % 3) * 26);
        for (let i = 0; i < 18; i += 1) this.addTree(110 + i * 126, 1500 - (i % 2) * 36);
        for (let i = 0; i < 9; i += 1) this.addTree(2260, 180 + i * 132);
      }

      addBuilding(x, y, w, h, label, bodyColor, roofColor) {
        this.addZoneObstacle(x, y, w, h, label);
        return null;
      }

      addZoneObstacle(x, y, w, h, label, color, shape) {
        const zone = this.add.zone(x + w / 2, y + h / 2, w, h);
        this.physics.add.existing(zone, true);
        zone.label = label;
        this.blockers.push(zone);
        return zone;
      }

      addTree(x, y) {
        const zone = this.add.zone(x, y + 24, 76, 92);
        this.physics.add.existing(zone, true);
        this.blockers.push(zone);
        return zone;
      }

      createPlayer() {
        const container = this.add.container(1200, 930);
        const shadow = this.add.ellipse(0, 10, 58, 18, 0x2a461f, 0.22);
        const sprite = this.add.image(0, 14, "characters", 0).setOrigin(0.5, 1);
        sprite.displayHeight = 148;
        sprite.scaleX = sprite.scaleY;
        container.add([shadow, sprite]);
        this.physics.add.existing(container);
        container.body.setSize(42, 42).setOffset(-21, -4).setCollideWorldBounds(true);
        this.player = container;
      }

      createNpcs() {
        [
          ["店長阿萊", 1060, 610, 0xf3a65d, "今天推薦雞腿排健康餐。", "orders"],
          ["菜園小幫手", 1680, 520, 0x7fb86f, "番茄和高麗菜快成熟了。", "garden"],
          ["好友小鎮民", 1430, 1020, 0xf0c16d, "要互送禮物嗎？", "friends"],
          ["活動主持人", 1000, 900, 0xa7d9d0, "新活動正在中央廣場。", "events"],
          ["商城老闆", 1660, 1160, 0xb87945, "今天優惠券補貨。", "shop"],
          ["外送員", 1510, 760, 0x64a6df, "訂單正在配送中。", "orders"]
        ].forEach(([name, x, y, color, line, open], index) => {
          const npc = this.add.container(x, y);
          npc.add(this.add.ellipse(0, 14, 48, 15, 0x2a461f, 0.18));
          const sprite = this.add.image(0, 18, "characters", index + 1).setOrigin(0.5, 1);
          sprite.displayHeight = 124;
          sprite.scaleX = sprite.scaleY;
          npc.add(sprite);
          npc.add(this.add.text(0, -51, name, { fontFamily: "Noto Sans TC", fontSize: "17px", fontStyle: "900", color: "#47341d", backgroundColor: "#fff8da", padding: { x: 8, y: 4 } }).setOrigin(0.5));
          npc.interaction = { id: `npc-${index}`, title: name, text: line, button: "互動", open };
          npc.setSize(58, 72).setInteractive();
          npc.on("pointerdown", () => {
            this.wavePlayer();
            openModal(open);
          });
          this.tweens.add({ targets: npc, y: y + 8, yoyo: true, repeat: -1, duration: 1600 + index * 160, ease: "Sine.inOut" });
          this.npcs.push(npc);
        });
      }

      createInteractions() {
        this.interactions = [
          { id: "shop", x: 1120, y: 560, radius: 150, title: "LAI便當店", text: "查看便當、加入購物車、結帳。", button: "去訂便當", open: "orders" },
          { id: "truck", x: 1510, y: 850, radius: 130, title: "便當餐車", text: "查看今日推薦與配送狀態。", button: "今日推薦", open: "todayRecommendation" },
          { id: "task", x: 590, y: 800, radius: 110, title: "任務看板", text: "每日、每週、新手、成就任務。", button: "任務中心", open: "tasks" },
          { id: "rank", x: 590, y: 1010, radius: 110, title: "排行榜看板", text: "便當王、送禮王、健康王排行。", button: "查看排行", open: "rankings" },
          { id: "garden", x: 1740, y: 500, radius: 150, title: "小菜園", text: "收成高麗菜、番茄、菇類、玉米。", button: "進入菜園", open: "garden" },
          { id: "friends", x: 1420, y: 1040, radius: 140, title: "好友廣場", text: "打招呼、送禮、看好友最近吃什麼。", button: "打招呼 / 送禮", open: "friends" },
          { id: "mail", x: 1770, y: 1050, radius: 105, title: "禮物郵箱", text: "查看收到與送出的禮物。", button: "查看禮物", open: "gifts" },
          { id: "shopStand", x: 1850, y: 1320, radius: 125, title: "商城攤位", text: "兌換優惠券、裝飾、周邊。", button: "進入商城", open: "shop" },
          { id: "table", x: 800, y: 1340, radius: 120, title: "我的餐桌", text: "佈置桌子、便當、植物、公仔。", button: "我的餐桌", open: "table" },
          { id: "group", x: 1260, y: 1370, radius: 130, title: "企業團購區", text: "公司團購、企業福利券、團體排行。", button: "企業訂餐", open: "groupOrder" },
          { id: "bus", x: 390, y: 1340, radius: 120, title: "巴士站", text: "出門逛逛附近活動與生活圈。", button: "出門逛逛", open: "explore" }
        ];
      }

      handlePointer(pointer) {
        const worldPoint = pointer.positionToCamera(this.cameras.main);
        const clickedNpc = this.npcs.find(npc => Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, npc.x, npc.y) < 58);
        if (clickedNpc) {
          this.openInteraction(clickedNpc.interaction);
          return;
        }

        const clickedInteraction = this.interactions.find(interaction => {
          return Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, interaction.x, interaction.y) < interaction.radius;
        });
        if (clickedInteraction) {
          this.openInteraction(clickedInteraction);
          return;
        }
        this.moveTarget = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
        this.addTargetRing(worldPoint.x, worldPoint.y);
      }

      openInteraction(interaction) {
        this.wavePlayer();
        this.activeInteraction = interaction;
        updateHint(interaction);
        openModal(interaction.open);
      }

      addTargetRing(x, y) {
        const ring = this.add.circle(x, y, 22, 0xffc84f, 0.18).setStrokeStyle(4, 0xffc84f, 0.95);
        this.tweens.add({ targets: ring, scale: 1.35, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
      }

      wavePlayer() {
        this.tweens.add({ targets: this.player, angle: 5, yoyo: true, repeat: 3, duration: 80 });
      }

      update() {
        if (!this.player) return;
        const speed = 220;
        const body = this.player.body;
        body.setVelocity(0, 0);

        let vx = 0;
        let vy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

        if (vx || vy) this.moveTarget = null;
        if (!vx && !vy && this.moveTarget) {
          const dx = this.moveTarget.x - this.player.x;
          const dy = this.moveTarget.y - this.player.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 8) this.moveTarget = null;
          else {
            vx = dx / distance;
            vy = dy / distance;
          }
        }

        if (vx || vy) {
          const len = Math.hypot(vx, vy) || 1;
          body.setVelocity((vx / len) * speed, (vy / len) * speed);
          this.player.scaleX = vx < 0 ? -1 : 1;
          this.player.y += Math.sin(this.time.now / 70) * 0.12;
        }

        let nearest = null;
        let nearestDistance = Infinity;
        for (const interaction of this.interactions) {
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, interaction.x, interaction.y);
          if (distance < interaction.radius && distance < nearestDistance) {
            nearest = interaction;
            nearestDistance = distance;
          }
        }
        for (const npc of this.npcs) {
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
          if (distance < 96 && distance < nearestDistance) {
            nearest = npc.interaction;
            nearestDistance = distance;
          }
        }
        if (nearest !== this.activeInteraction) {
          this.activeInteraction = nearest;
          updateHint(nearest);
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: mount,
      width: mount.clientWidth || window.innerWidth,
      height: mount.clientHeight || window.innerHeight,
      backgroundColor: "#9fd7ee",
      physics: { default: "arcade", arcade: { debug: false } },
      scene: LaiTownScene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    const game = new Phaser.Game(config);
    window.addEventListener("resize", () => {
      if (game.scale) game.scale.resize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
    });
    toast("LAI便當小鎮已切換為 Phaser 遊戲世界。");
    return true;
  }

  window.LAI_PHASER_TOWN = { mount: mountLaiPhaserTown };
})();
