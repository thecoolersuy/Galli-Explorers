import BaseMazeScene from "./BaseMazeScene.js";
import RathObstacle from "../sprites/RathObstacle.js";
import Phaser from "phaser";
import audio from "../styles/audio.js";
import MazeCollectible from "../sprites/MazeCollectible.js";

const RATH_MOVE_MS = 380;
const BALL_MOVE_MS = 320;
const LAKHEY_WALK_ACTIVE_MS = 280;
const LAKHEY_SOURCE_TEXTURE = "lakheyfinal-source";
const LAKHEY_FRAME_TEXTURE_PREFIX = "lakhey-walk-frame";
const LAKHEY_ANIMATION = "lakhey-walk-cycle";
const LAKHEY_FRAME_WIDTH = 258;
const LAKHEY_FRAME_HEIGHT = 400;
const LAKHEY_FRAME_SOURCE_Y = 124;
const LAKHEY_VISIBLE_HEIGHT = 320;
const LAKHEY_SCALE = 56 / LAKHEY_VISIBLE_HEIGHT;
const LAKHEY_ORIGIN_Y = 389 / LAKHEY_FRAME_HEIGHT;
const LAKHEY_STATE_IDLE = "idle";
const LAKHEY_STATE_WALKING = "walking";
const LAKHEY_STATE_CAUGHT = "caught";
const TOTAL_COLLECTIBLES = 3;

export default class Level3Scene extends BaseMazeScene {
  constructor() {
    super("Level3Scene", {
      level: 3,
      nextLevel: 4,
      gameOverText: "Rath hit you!",
    });
  }

  preload() {
    super.preload();

    this.load.image(
      LAKHEY_SOURCE_TEXTURE,
      new URL("../assets/img/lakheyfinal.png", import.meta.url).href,
    );
    this.load.image(
      "rath",
      new URL("../assets/img/rathbrown.png", import.meta.url).href,
    );
    this.load.image(
      "yomari",
      new URL("../assets/img/yomari.png", import.meta.url).href,
    );

    this.load.audio(
      "rath-dhim",
      new URL("../assets/audio/rath-dhim.wav", import.meta.url).href,
    );
    this.load.audio(
      "collect-yomari",
      new URL("../assets/audio/collect-yomari.wav", import.meta.url).href,
    );
  }

  _configureLevel() {
    this.rathRoutes = this._configureRathRoutes();
    this.redBallStart = {
      r: 1,
      c: 1,
    };
    this._openRathRing(this.redBallStart.r, this.redBallStart.c);
  }

  _setupLevelObjects() {
    this.rathObstacles = this.rathRoutes.map(
      (route, index) =>
        new RathObstacle(this, {
          route,
          phase: index * 2,
          moveMs: RATH_MOVE_MS + index * 70,
        }),
    );

    for (const rath of this.rathObstacles) {
      rath.currentCell = rath.route[0];
    }

    this.redBalls = [{
      currentCell: { ...this.redBallStart },
      previousCell: { ...this.redBallStart },
      isMoving: false,
      lastMovedAt: 0,
      state: LAKHEY_STATE_IDLE,
      sprite: null,
    }];

    this._createLakheyAnimation();
    this._createBallSprites();

    this.collectedCount = 0;
    this._chooseCollectibleCells();

    this.playerHasMoved = false;
    this.isChasing = false;
    this.lastChaseMoveTime = 0;

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.collectSound = this.sound.add("collect-yomari", {
      volume: 0.45,
    });

    this.currentRathVolume = 0;
  }

  _beginLevel() {
    this.rathSound?.play();
  }

  _setupCollectiblesHUD() {
    const hudX = this.scale.width - 100;
    const hudY = 30;

    this.hudGfx = this.add.graphics();
    this.hudGfx.setDepth(99);
    this._drawHudPill(hudX, hudY);

    this.collectiblesText = this.add
      .text(
        hudX,
        hudY,
        `yomari ${this.collectedCount}/${TOTAL_COLLECTIBLES}`,
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "14px",
          color: "#f5f0e6",
        }
      )
      .setOrigin(0.5)
      .setDepth(100);
  }

  _drawHudPill(cx, cy, alpha = 0.92) {
    const w = 140;
    const h = 38;
    const r = 19;
    const x = cx - w / 2;
    const y = cy - h / 2;

    this.hudGfx.clear();
    this.hudGfx.fillStyle(0x6d4c2b, alpha);
    this.hudGfx.fillRoundedRect(x, y, w, h, r);
    this.hudGfx.lineStyle(2, 0x8b7355, 1);
    this.hudGfx.strokeRoundedRect(x, y, w, h, r);
  }

  _updateCollectiblesHUD() {
    this._emitCollectibleProgress();
  }

  _showCollectNotification() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 100;

    const notification = this.add
      .text(centerX, centerY, "🍢 YOMARI COLLECTED! 🍢", {
        fontFamily: "EarlyGameBoy",
        fontSize: "24px",
        color: "#f5f0e6",
        backgroundColor: "#6d4c2b",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(150)
      .setAlpha(1);

    this.tweens.add({
      targets: notification,
      y: centerY - 40,
      alpha: 0,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        notification.destroy();
      },
    });
  }

  _chooseCollectibleCells() {
    const reachable = [];
    const visited = new Set();
    const queue = [{ r: 0, c: 0 }];

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      visited.add(key);

      reachable.push({ r, c });

      const cell = this.grid[r * this.ncols + c];

      if (!cell.walls[0] && r > 0) queue.push({ r: r - 1, c });
      if (!cell.walls[1] && c < this.ncols - 1) queue.push({ r, c: c + 1 });
      if (!cell.walls[2] && r < this.nrows - 1) queue.push({ r: r + 1, c });
      if (!cell.walls[3] && c > 0) queue.push({ r, c: c - 1 });
    }

    const candidates = reachable.filter(
      ({ r, c }) =>
        !(r === 0 && c === 0) &&
        !(r === this.nrows - 1 && c === this.ncols - 1) &&
        !this._isNearObstacle(r, c)
    );

    Phaser.Utils.Array.Shuffle(candidates);

    this.collectibles = candidates
      .slice(0, TOTAL_COLLECTIBLES)
      .map(
        (cell, index) =>
          new MazeCollectible(this, {
            r: cell.r,
            c: cell.c,
            id: `collectible-${index}`,
          })
      );
  }

  _isNearObstacle(r, c) {
    for (const route of this.rathRoutes) {
      for (const pos of route) {
        const dist = Math.abs(pos.r - r) + Math.abs(pos.c - c);
        if (dist <= 4) return true;
      }
    }
    return false;
  }

  _emitCollectibleProgress() {
    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.events.emit(
        "collectiblesChanged",
        this.collectedCount,
        TOTAL_COLLECTIBLES,
      );
    }
  }

  _createBallSprites() {
    this._createLakheyFrameTextures();

    for (const ball of this.redBalls) {
      ball.sprite = this.add.sprite(0, 0, `${LAKHEY_FRAME_TEXTURE_PREFIX}-0`);
      ball.sprite.setOrigin(0.5, LAKHEY_ORIGIN_Y);
      ball.sprite.setDepth(25);
      ball.sprite.setScale(LAKHEY_SCALE);
      ball.sprite.setTexture(`${LAKHEY_FRAME_TEXTURE_PREFIX}-0`);
    }
  }

  _drawBalls() {
    for (const ball of this.redBalls) {
      const { x, y } = this._cellCenter(ball.currentCell.r, ball.currentCell.c);
      ball.sprite.setPosition(x, y + this.CELL_SIZE / 2);
    }
  }

  _createLakheyAnimation() {
    if (this.anims.exists(LAKHEY_ANIMATION)) return;

    this._createLakheyFrameTextures();

    this.anims.create({
      key: LAKHEY_ANIMATION,
      frames: this.lakheyFrameKeys.map((key) => ({ key })),
      frameRate: 6,
      repeat: -1,
    });
  }

  _createLakheyFrameTextures() {
    if (this.lakheyFrameKeys) return;

    const source = this.textures.get(LAKHEY_SOURCE_TEXTURE).getSourceImage();
    const frameCount = Math.floor(source.width / LAKHEY_FRAME_WIDTH);

    this.lakheyFrameKeys = Array.from({ length: frameCount }, (_, index) => {
      const key = `${LAKHEY_FRAME_TEXTURE_PREFIX}-${index}`;
      if (this.textures.exists(key)) return key;

      const frameTexture = this.textures.createCanvas(
        key,
        LAKHEY_FRAME_WIDTH,
        LAKHEY_FRAME_HEIGHT,
      );
      const ctx = frameTexture.context;
      ctx.clearRect(0, 0, LAKHEY_FRAME_WIDTH, LAKHEY_FRAME_HEIGHT);
      ctx.drawImage(
        source,
        index * LAKHEY_FRAME_WIDTH,
        LAKHEY_FRAME_SOURCE_Y,
        LAKHEY_FRAME_WIDTH,
        LAKHEY_FRAME_HEIGHT,
        0,
        0,
        LAKHEY_FRAME_WIDTH,
        LAKHEY_FRAME_HEIGHT,
      );
      frameTexture.refresh();
      return key;
    });
  }

  _updateLevel(time) {
    for (const rath of this.rathObstacles) {
      rath.update(time);

      const routeLength = rath.route ? rath.route.length : 0;
      if (routeLength > 0) {
        const step =
          Math.floor(time / rath.moveMs + rath.phase) % routeLength;
        rath.currentCell = rath.route[step];
      }
    }

    if (this.gameOver) {
      this._freezeLakheyAnimation();
    } else if (this.isChasing) {
      if (!this.lastChaseMoveTime) {
        this.lastChaseMoveTime = time;
      }

      if (time - this.lastChaseMoveTime >= BALL_MOVE_MS) {
        this.lastChaseMoveTime = time;

        const ball = this.redBalls[0];
        ball.previousCell = { ...ball.currentCell };
        const path = this._findMazePath(ball.currentCell, this.playerPos);
        if (path && path.length > 1) {
          ball.currentCell = path[1];
        }
        ball.isMoving =
          ball.currentCell.r !== ball.previousCell.r ||
          ball.currentCell.c !== ball.previousCell.c;
        if (ball.isMoving) {
          ball.lastMovedAt = time;
        }
      }
    } else if (this.redBalls) {
      for (const ball of this.redBalls) {
        ball.isMoving = false;
      }
    }

    this._drawBalls();
    this._updateLakheyAnimation(time);

    if (this._isHazardAt(this.playerPos.r, this.playerPos.c)) {
      this._freezeLakheyAnimation();
      this._triggerGameOver(this.gameOverText);
    }

    this._updateRathSound();
  }

  _updateLakheyAnimation(time) {
    if (!this.redBalls) return;

    for (const ball of this.redBalls) {
      if (!ball.sprite) continue;
      if (ball.state === LAKHEY_STATE_CAUGHT) continue;
      const isMoving = ball.lastMovedAt > 0 && time - ball.lastMovedAt <= LAKHEY_WALK_ACTIVE_MS;

      if (isMoving) {
        this._setLakheyState(ball, LAKHEY_STATE_WALKING);
      } else {
        this._setLakheyState(ball, LAKHEY_STATE_IDLE);
      }

      ball.isMoving = isMoving;
    }
  }

  _setLakheyState(ball, state) {
    if (!ball.sprite || ball.state === LAKHEY_STATE_CAUGHT) return;

    if (ball.state === state) return;
    ball.state = state;

    if (state === LAKHEY_STATE_WALKING) {
      ball.sprite.play(LAKHEY_ANIMATION, true);
      return;
    }

    if (ball.sprite.anims.isPlaying) {
      ball.sprite.anims.stop();
    }
    ball.sprite.setTexture(`${LAKHEY_FRAME_TEXTURE_PREFIX}-0`);
  }

  _freezeLakheyAnimation() {
    if (!this.redBalls) return;

    for (const ball of this.redBalls) {
      if (!ball.sprite) continue;

      if (ball.sprite.anims.isPlaying) {
        ball.sprite.anims.stop();
      }
      ball.state = LAKHEY_STATE_CAUGHT;
      ball.isMoving = false;
      ball.lastMovedAt = 0;
    }
  }

  _triggerGameOver(message = "Game Over!") {
    this._freezeLakheyAnimation();
    super._triggerGameOver(message);
  }

  _afterPlayerMove(fromCell, toCell) {
    super._afterPlayerMove(fromCell, toCell);

    for (const collectible of this.collectibles) {
      if (!collectible.matchesCell(this.playerPos.r, this.playerPos.c)) continue;

      if (collectible.collect()) {
        this.collectedCount++;
        this.collectSound.play();
        this._showCollectNotification();
        this._updateCollectiblesHUD();
        this._emitCollectibleProgress();
        this.achievementTracker?.recordYomariCollected(this.collectedCount);
      }
    }

    if (!this.playerHasMoved) {
      this.playerHasMoved = true;
      this.time.delayedCall(5000, () => {
        this.isChasing = true;
      });
    }
  }

  _updateRathSound() {
    if (!this.rathSound) return;

    let minDist = Infinity;

    for (const rath of this.rathObstacles) {
      if (!rath.currentCell) continue;

      const dist =
        Math.abs(this.playerPos.r - rath.currentCell.r) +
        Math.abs(this.playerPos.c - rath.currentCell.c);

      if (dist < minDist) {
        minDist = dist;
      }
    }

    const { maxHearDist, maxVolume, smoothing } = audio.rath;

    const proximity = Phaser.Math.Clamp(
      1 - minDist / maxHearDist,
      0,
      1,
    );

    const eased = proximity * proximity * (3 - 2 * proximity);
    const targetVolume = eased * maxVolume;

    this.currentRathVolume = Phaser.Math.Linear(
      this.currentRathVolume,
      targetVolume,
      smoothing,
    );

    this.rathSound.setVolume(this.currentRathVolume);
  }

  _isHazardAt(r, c) {
    return this._isRathAt(r, c) || this._isBallAt(r, c);
  }

  _isRathAt(r, c) {
    return this.rathObstacles
      ? this.rathObstacles.some((rath) => rath.occupiesCell(r, c))
      : false;
  }

  _isBallAt(r, c) {
    return this.redBalls
      ? this.redBalls.some((ball) => ball.currentCell.r === r && ball.currentCell.c === c)
      : false;
  }

  _stopLevelAudio() {
    if (this.rathSound) {
      this.rathSound.stop();
    }
  }

  _configureRathRoutes() {
    const anchors = [
      { r: Math.floor(this.nrows * 0.24), c: Math.floor(this.ncols * 0.72) },
      { r: Math.floor(this.nrows * 0.50), c: Math.floor(this.ncols * 0.35) },
      { r: Math.floor(this.nrows * 0.68), c: Math.floor(this.ncols * 0.70) },
    ];

    const routes = [];

    for (const anchor of anchors) {
      if (
        anchor.r < 2 ||
        anchor.c < 2 ||
        anchor.r >= this.nrows - 2 ||
        anchor.c >= this.ncols - 2
      ) {
        continue;
      }

      const route = this._buildRathRoute(anchor.r, anchor.c);
      if (route.length < 4) continue;

      this._openRathRing(anchor.r, anchor.c);
      routes.push(route);
    }

    return routes;
  }

  _buildRathRoute(r, c) {
    return [
      { r: r - 1, c: c - 1 },
      { r: r - 1, c },
      { r: r - 1, c: c + 1 },
      { r, c: c + 1 },
      { r: r + 1, c: c + 1 },
      { r: r + 1, c },
      { r: r + 1, c: c - 1 },
      { r, c: c - 1 },
    ].filter(
      ({ r: row, c: col }) =>
        row > 0 &&
        col > 0 &&
        row < this.nrows - 1 &&
        col < this.ncols - 1 &&
        !(row === 0 && col === 0) &&
        !(row === this.nrows - 1 && col === this.ncols - 1),
    );
  }

  _openRathRing(r, c) {
    const ring = [
      [r - 1, c - 1],
      [r - 1, c],
      [r - 1, c + 1],
      [r, c + 1],
      [r + 1, c + 1],
      [r + 1, c],
      [r + 1, c - 1],
      [r, c - 1],
    ];

    for (let index = 0; index < ring.length; index++) {
      const [r1, c1] = ring[index];
      const [r2, c2] = ring[(index + 1) % ring.length];
      this._openPassage(r1, c1, r2, c2);
    }
  }

  _openPassage(r1, c1, r2, c2) {
    if (
      r1 < 0 ||
      c1 < 0 ||
      r2 < 0 ||
      c2 < 0 ||
      r1 >= this.nrows ||
      r2 >= this.nrows ||
      c1 >= this.ncols ||
      c2 >= this.ncols
    ) {
      return;
    }

    const cell1 = this.grid[r1 * this.ncols + c1];
    const cell2 = this.grid[r2 * this.ncols + c2];

    if (!cell1 || !cell2) return;

    if (r1 === r2 && c1 + 1 === c2) {
      cell1.walls[1] = false;
      cell2.walls[3] = false;
    } else if (r1 === r2 && c1 - 1 === c2) {
      cell1.walls[3] = false;
      cell2.walls[1] = false;
    } else if (c1 === c2 && r1 + 1 === r2) {
      cell1.walls[2] = false;
      cell2.walls[0] = false;
    } else if (c1 === c2 && r1 - 1 === r2) {
      cell1.walls[0] = false;
      cell2.walls[2] = false;
    }
  }
}