(function () {
  function mountLaiPhaserTown(options) {
    if (!window.Phaser) return false;

    const mount = document.querySelector("#lifePhaserMount");
    if (!mount) return false;
    mount.innerHTML = "";

    const openModal = options.openModal;
    const updateHint = options.updateHint;
    const toast = options.toast;
    const world = { width: 941, height: 2037 };

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
        const fullMapZoom = Math.min(width / world.width, height / world.height);
        const coverZoom = Math.max(width / world.width, height / world.height) * 1.02;
        const zoom = isPortraitPhone ? fullMapZoom : isTablet ? Math.max(coverZoom, 0.46) : 0.72;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.setLerp(isPortraitPhone ? 0.08 : 0.12, isPortraitPhone ? 0.08 : 0.12);
        this.cameras.main.centerOn(this.player.x, this.player.y);
      }

      drawTown() {
        const bg = this.add.image(world.width / 2, world.height / 2, "townBg");
        bg.setDisplaySize(world.width, world.height).setAlpha(1);

        this.addZoneObstacle(392, 880, 160, 118, "噴水池", 0x78b7c7, "circle");
        this.addBuilding(310, 365, 320, 210, "LAI 便當", 0xfff3d6, 0xffc84f);
        this.addBuilding(690, 360, 180, 150, "便當餐車", 0xfff8da, 0x7fb86f);
        this.addBuilding(260, 1240, 220, 210, "小菜園", 0xf3e2bd, 0x7fb86f);
        this.addBuilding(26, 650, 170, 170, "任務看板", 0xfff8da, 0xb87945);
        this.addBuilding(680, 910, 220, 205, "排行榜", 0xfff8da, 0xffc84f);
        this.addBuilding(685, 1218, 130, 160, "禮物郵箱", 0xf06a55, 0xffc84f);
        this.addBuilding(690, 690, 190, 160, "商城攤位", 0xfff8da, 0xb87945);
        this.addBuilding(60, 1420, 220, 210, "我的餐桌", 0xfff8da, 0x8b6f3c);
        this.addBuilding(70, 330, 230, 210, "企業團購", 0xe8eef6, 0x7fb86f);
        this.addBuilding(650, 1550, 230, 210, "巴士站", 0xf7d37c, 0x64a6df);
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
        const container = this.add.container(470, 1050);
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
          ["店長阿萊", 420, 620, 0xf3a65d, "今天推薦雞腿排健康餐。", "orders"],
          ["菜園小幫手", 340, 1470, 0x7fb86f, "番茄和高麗菜快成熟了。", "garden"],
          ["好友小鎮民", 175, 1120, 0xf0c16d, "要互送禮物嗎？", "friends"],
          ["活動主持人", 420, 930, 0xa7d9d0, "新活動正在中央廣場。", "events"],
          ["商城老闆", 760, 860, 0xb87945, "今天優惠券補貨。", "shop"],
          ["外送員", 770, 610, 0x64a6df, "訂單正在配送中。", "orders"]
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
          { id: "shop", x: 470, y: 610, radius: 78, title: "LAI\u4fbf\u7576\u5e97", text: "\u9032\u5165\u8a02\u8cfc\u8207\u4eca\u65e5\u9910\u76d2\u3002", button: "\u8a02\u4fbf\u7576", open: "orders" },
          { id: "truck", x: 770, y: 620, radius: 68, title: "\u4fbf\u7576\u9910\u8eca", text: "\u67e5\u770b\u4eca\u65e5\u63a8\u85a6\u9910\u76d2\u3002", button: "\u4eca\u65e5\u63a8\u85a6", open: "todayRecommendation" },
          { id: "task", x: 110, y: 790, radius: 66, title: "\u4efb\u52d9\u677f", text: "\u67e5\u770b\u6bcf\u65e5\u4efb\u52d9\u8207\u734e\u52f5\u3002", button: "\u4efb\u52d9\u4e2d\u5fc3", open: "tasks" },
          { id: "rank", x: 770, y: 1070, radius: 72, title: "\u6392\u884c\u699c", text: "\u67e5\u770b\u4fbf\u7576\u738b\u8207\u597d\u53cb\u6392\u884c\u3002", button: "\u6392\u884c\u699c", open: "rankings" },
          { id: "garden", x: 345, y: 1390, radius: 78, title: "\u5c0f\u83dc\u5712", text: "\u6536\u6210\u98df\u6750\u4e26\u7d2f\u7a4d\u98df\u6750\u9ede\u6578\u3002", button: "\u9032\u5165\u83dc\u5712", open: "garden" },
          { id: "friends", x: 175, y: 1120, radius: 68, title: "\u597d\u53cb\u5ee3\u5834", text: "\u627e\u597d\u53cb\u3001\u6253\u62db\u547c\u8207\u9001\u79ae\u3002", button: "\u597d\u53cb", open: "friends" },
          { id: "mail", x: 745, y: 1325, radius: 70, title: "\u79ae\u7269\u90f5\u7bb1", text: "\u67e5\u770b\u6536\u5230\u8207\u9001\u51fa\u7684\u79ae\u7269\u3002", button: "\u79ae\u7269", open: "gifts" },
          { id: "shopStand", x: 775, y: 820, radius: 72, title: "\u512a\u60e0\u5546\u57ce", text: "\u514c\u63db\u512a\u60e0\u5238\u3001\u52a0\u83dc\u5238\u8207\u88dd\u98fe\u54c1\u3002", button: "\u5546\u57ce", open: "shop" },
          { id: "table", x: 170, y: 1530, radius: 76, title: "\u6211\u7684\u9910\u684c", text: "\u4f48\u7f6e\u500b\u4eba\u9910\u684c\u7a7a\u9593\u3002", button: "\u6211\u7684\u9910\u684c", open: "table" },
          { id: "group", x: 180, y: 500, radius: 76, title: "\u4f01\u696d\u5718\u8cfc", text: "\u67e5\u770b\u516c\u53f8\u8207\u5718\u9ad4\u8a02\u9910\u3002", button: "\u4f01\u696d\u8a02\u9910", open: "groupOrder" },
          { id: "bus", x: 760, y: 1650, radius: 76, title: "\u63a2\u7d22\u51fa\u767c\u7ad9", text: "\u51fa\u9580\u901b\u901b\u9644\u8fd1\u6d3b\u52d5\u8207\u751f\u6d3b\u5708\u3002", button: "\u51fa\u9580\u901b\u901b", open: "explore" }
        ];
      }

      handlePointer(pointer) {
        const worldPoint = pointer.positionToCamera(this.cameras.main);
        const clickedNpc = this.npcs.find(npc => Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, npc.x, npc.y) < 58);
        if (clickedNpc) {
          this.moveTarget = new Phaser.Math.Vector2(clickedNpc.x, clickedNpc.y + 72);
          this.addTargetRing(clickedNpc.x, clickedNpc.y + 72);
          return;
        }

        const clickedInteraction = this.interactions.find(interaction => {
          return Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, interaction.x, interaction.y) < interaction.radius;
        });
        if (clickedInteraction) {
          this.moveTarget = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
          this.addTargetRing(worldPoint.x, worldPoint.y);
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
