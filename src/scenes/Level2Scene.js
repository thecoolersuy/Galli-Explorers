import Phaser from "phaser";
import Cell from "../logic/Cell.js";
import MazeGenerator from "../logic/MazeGenerator.js";
import colors from "../styles/colors.js";
import audio from "../styles/audio.js";
import ProgressManager from "../logic/ProgressManager.js";
import MazeCollectible from "../sprites/MazeCollectible.js";
import {
  applyCharacterSpriteLayout,
  createCharacterWalkAnimation,
  getCharacterCellScale,
  getCharacterConfig,
  getCharacterRenderPosition,
} from "../logic/CharacterConfig.js";
import { processHeldMovement, setupHeldKeyInput } from "../logic/PlayerInput.js";

const CELL_SIZE = 45;
const WALL_THICKNESS = 8;
const WALL_COLOR = colors.accentNum;
const BORDER_THICKNESS = 8;
const BORDER_COLOR = 0x7a5a34;
const VISITED_COLOR = 0x8f6b3a;
const GOAL_COLOR = colors.lightNum;
const PLAYER_COLOR = 0xff6b6b;
const OBSTACLE_FILL = colors.obstacleFillNum;
const OBSTACLE_DARK = colors.obstacleDarkNum;
const OBSTACLE_ACCENT = colors.obstacleAccentNum;
const OBSTACLE_MOVE_MS = 380;
const DARKNESS_COLOR = "rgba(3, 4, 8, 0.90)";
const TORCH_RADIUS = 130;
const PIXEL_BLOCK = 16;
const MAZE_DEPTH = 0;
const WALL_DEPTH = 10;
const GOAL_DEPTH = 15;
const OBSTACLE_DEPTH = 20;
const DARKNESS_DEPTH = 50;
const PLAYER_DEPTH = 60;
const MESSAGE_DEPTH = 80;
const TOTAL_COLLECTIBLES = 3;

let darknessTextureId = 0;

export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super("Level2Scene");
  }

  preload() {
    this.load.image(
      "rath",
      new URL("../assets/img/rathbrown.png", import.meta.url).href,
    );

    this.load.audio(
      "rath-dhim",
      new URL("../assets/audio/rath-dhim.wav", import.meta.url).href,
    );

    this.load.audio(
      "footsteps-wood",
      new URL("../assets/audio/footstep_wood_000.ogg", import.meta.url).href,
    );

    this.load.audio(
      "impact-plate",
      new URL("../assets/audio/impactPlate_medium_002.ogg", import.meta.url)
        .href,
    );

    this.load.audio(
      "level-completed",
      new URL("../assets/audio/levelcompleted.mp3", import.meta.url).href,
    );

    // Load player atlas
    this.load.atlas(
      "player-girl",
      new URL("../assets/img/1.png", import.meta.url).href,
      new URL("../assets/img/1.json", import.meta.url).href
    );
  }

  create() {
    this.CELL_SIZE = CELL_SIZE;
    this.ncols = Math.floor(this.scale.width / CELL_SIZE) - 1;
    this.nrows = Math.floor(this.scale.height / CELL_SIZE) - 2;

    this.offsetX = Math.floor((this.scale.width - this.ncols * CELL_SIZE) / 2);
    this.offsetY = Math.floor((this.scale.height - this.nrows * CELL_SIZE) / 2);

    this.gameOver = false;
    this.collectedCount = 0;
    this.playerCharacter = getCharacterConfig(ProgressManager.getSelectedCharacter());

    this._buildMaze();
    this._placeObstacles();
    this._chooseCollectibleCells();
    this._drawMaze();
    this._createPlayerAnimation();
    this._setupPlayer();
    this._setupFlashlight();
    this._setupInput();
    this._setupCollectiblesHUD();

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });
    this.currentRathVolume = 0;

    this.footstepSound = this.sound.add("footsteps-wood", {
      volume: 2,
    });

    this.impactSound = this.sound.add("impact-plate", {
      volume: 0.5,
    });

    this.levelCompletedSound = this.sound.add("level-completed", {
      volume: 1,
    });

    this.collectSound = this.sound.add("collect-yomari", {
      volume: 0.45,
    });

    

    this.rathSound.play();
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
    this.collectiblesText.setText(
      `yomari ${this.collectedCount}/${TOTAL_COLLECTIBLES}`
    );
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

  _buildMaze() {
    const { nrows, ncols } = this;
    this.grid = [];

    for (let row = 0; row < nrows; row++) {
      for (let col = 0; col < ncols; col++) {
        this.grid.push(new Cell(row, col, nrows, ncols));
      }
    }

    for (let cell of this.grid) {
      cell.createNeighbors(this.grid);
    }

    const generator = new MazeGenerator(this.grid, ncols);
    generator.generate();
  }

  _placeObstacles() {
    const anchors = [
      { r: Math.floor(this.nrows * 0.22), c: Math.floor(this.ncols * 0.28) },
      { r: Math.floor(this.nrows * 0.25), c: Math.floor(this.ncols * 0.72) },
      { r: Math.floor(this.nrows * 0.62), c: Math.floor(this.ncols * 0.38) },
      { r: Math.floor(this.nrows * 0.68), c: Math.floor(this.ncols * 0.72) },
    ];

    this.obstacles = [];

    for (let index = 0; index < anchors.length; index++) {
      const { r, c } = anchors[index];
      if (r < 2 || c < 2 || r >= this.nrows - 2 || c >= this.ncols - 2) {
        continue;
      }

      const route = this._buildObstacleRoute(r, c);
      if (route.length < 4) {
        continue;
      }

      this._openObstacleRing(r, c);

      this.obstacles.push({
        anchor: { r, c },
        route,
        phase: index * 2,
        moveMs: OBSTACLE_MOVE_MS + index * 70,
        currentIndex: 0,
        currentCell: route[0],
      });
    }
  }

  _buildObstacleRoute(r, c) {
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

  _openObstacleRing(r, c) {
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

      if (!cell.walls[0] && r > 0)
        queue.push({ r: r - 1, c });

      if (!cell.walls[1] && c < this.ncols - 1)
        queue.push({ r, c: c + 1 });

      if (!cell.walls[2] && r < this.nrows - 1)
        queue.push({ r: r + 1, c });

      if (!cell.walls[3] && c > 0)
        queue.push({ r, c: c - 1 });
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

     this.collectibles.forEach((collectible) => {
      collectible.sprite.setDepth(15);
     });
  }

  _isNearObstacle(r, c) {
    for (const obstacle of this.obstacles) {
      for (const pos of obstacle.route) {
        const dist = Math.abs(pos.r - r) + Math.abs(pos.c - c);

        if (dist <= 4) {
          return true;
        }
      }
    }

    return false;
  }

  _drawMaze() {
    const { nrows, ncols, grid, offsetX, offsetY } = this;
    const S = CELL_SIZE;

    this.cellGraphics = this.add.graphics();
    this.cellGraphics.setDepth(MAZE_DEPTH);

    for (let cell of grid) {
      const x = offsetX + cell.c * S;
      const y = offsetY + cell.r * S;
      this.cellGraphics.fillStyle(VISITED_COLOR, 0.15);
      this.cellGraphics.fillRect(x, y, S, S);
    }

    const goal = grid[nrows * ncols - 1];
    this.cellGraphics.fillStyle(GOAL_COLOR, 0.5);
    this.cellGraphics.fillRect(
      offsetX + goal.c * S,
      offsetY + goal.r * S,
      S,
      S,
    );

    this.wallGraphics = this.add.graphics();
    this.wallGraphics.setDepth(WALL_DEPTH);

    for (let cell of grid) {
      const x = offsetX + cell.c * S;
      const y = offsetY + cell.r * S;

      if (cell.walls[0]) {
        this.wallGraphics.lineStyle(
          cell.r === 0 ? BORDER_THICKNESS : WALL_THICKNESS,
          cell.r === 0 ? BORDER_COLOR : WALL_COLOR,
          1,
        );
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y);
        this.wallGraphics.lineTo(x + S, y);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[1]) {
        this.wallGraphics.lineStyle(
          cell.c === ncols - 1 ? BORDER_THICKNESS : WALL_THICKNESS,
          cell.c === ncols - 1 ? BORDER_COLOR : WALL_COLOR,
          1,
        );
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x + S, y);
        this.wallGraphics.lineTo(x + S, y + S);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[2]) {
        this.wallGraphics.lineStyle(
          cell.r === nrows - 1 ? BORDER_THICKNESS : WALL_THICKNESS,
          cell.r === nrows - 1 ? BORDER_COLOR : WALL_COLOR,
          1,
        );
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y + S);
        this.wallGraphics.lineTo(x + S, y + S);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[3]) {
        this.wallGraphics.lineStyle(
          cell.c === 0 ? BORDER_THICKNESS : WALL_THICKNESS,
          cell.c === 0 ? BORDER_COLOR : WALL_COLOR,
          1,
        );
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y);
        this.wallGraphics.lineTo(x, y + S);
        this.wallGraphics.strokePath();
      }
    }

    this.add
      .text(
        offsetX + goal.c * S + S / 2,
        offsetY + goal.r * S + S / 2,
        "GHAR",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "22px",
          color: colors.textDark,
        },
      )
      .setOrigin(0.5)
      .setDepth(GOAL_DEPTH);

    this._createObstacleSprites();
    this._drawObstacles();
  }

  _drawObstacles() {
    const S = CELL_SIZE;

    for (const obstacle of this.obstacles) {
      if (!obstacle.sprite) {
        continue;
      }

      const { r, c } = obstacle.currentCell;
      obstacle.sprite.setPosition(
        this.offsetX + c * S + S / 2,
        this.offsetY + r * S + S / 2,
      );
    }
  }

  _createObstacleSprites() {
    const S = CELL_SIZE;
    const textureKey = "rath-obstacle";
    const targetWidth = Math.max(1, Math.round(S * 1.5 * 1.2));
    const targetHeight = Math.max(1, Math.round(S * 1.8));

    if (!this.textures.exists(textureKey)) {
      const sourceTexture = this.textures.get("rath");
      const source = sourceTexture.getSourceImage();
      const renderTexture = this.textures.createCanvas(
        textureKey,
        targetWidth,
        targetHeight,
      );
      const ctx = renderTexture.context;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
      renderTexture.refresh();
    }

    for (const obstacle of this.obstacles) {
      obstacle.sprite = this.add.image(0, 0, textureKey);
      obstacle.sprite.setOrigin(0.5);
      obstacle.sprite.setDepth(OBSTACLE_DEPTH);
    }
  }

  _setupPlayer() {
    this.playerPos = { r: 0, c: 0 };
    this.lastDirection = 1;
    this.isPlayerMoving = false;

    const scale = getCharacterCellScale(this.playerCharacter, CELL_SIZE);

    const cellCenterX = this.offsetX + this.playerPos.c * CELL_SIZE + CELL_SIZE / 2;
    const cellCenterY = this.offsetY + this.playerPos.r * CELL_SIZE + CELL_SIZE / 2;
    const { x, y } = getCharacterRenderPosition(
      this.playerCharacter,
      cellCenterX,
      cellCenterY,
      CELL_SIZE,
    );

    this.playerSprite = this.add.sprite(
      x,
      y,
      this.playerCharacter.textureKey,
      this.playerCharacter.idleFrame,
    );
    applyCharacterSpriteLayout(this.playerSprite, this.playerCharacter, scale);
    this.playerSprite.setDepth(PLAYER_DEPTH);
    this._setPlayerIdle();
  }

  _drawPlayer() {
    const { offsetX, offsetY, playerPos } = this;
    const S = CELL_SIZE;

    const { x, y } = getCharacterRenderPosition(
      this.playerCharacter,
      offsetX + playerPos.c * S + S / 2,
      offsetY + playerPos.r * S + S / 2,
      S,
    );
    this.playerSprite.setPosition(x, y);
  }

  _createPlayerAnimation() {
    createCharacterWalkAnimation(this, this.playerCharacter, "player-walk");
  }

  _setPlayerIdle() {
    if (!this.playerSprite) return;
    if (this.playerSprite.anims.isPlaying) {
      this.playerSprite.anims.stop();
    }
    this.playerSprite.setFrame(this.playerCharacter.idleFrame);
  }

  _setPlayerRunning() {
    if (!this.playerSprite) return;
    this.playerSprite.play("player-walk", true);
  }

  _setupFlashlight() {
    const textureKey = `level2-darkness-${darknessTextureId}`;
    darknessTextureId += 1;

    this.darknessTexture = this.textures.createCanvas(
      textureKey,
      this.scale.width,
      this.scale.height,
    );
    this.darknessImage = this.add
      .image(0, 0, textureKey)
      .setOrigin(0)
      .setDepth(DARKNESS_DEPTH);

    this._updateFlashlight();
  }

  _getPlayerCenter() {
    const S = CELL_SIZE;

    return {
      x: this.offsetX + this.playerPos.c * S + S / 2,
      y: this.offsetY + this.playerPos.r * S + S / 2,
    };
  }

  _updateFlashlight() {
    if (!this.darknessTexture) return;

    const ctx = this.darknessTexture.context;
    let { x, y } = this._getPlayerCenter();
    const B = PIXEL_BLOCK;
    const R = TORCH_RADIUS;
    const W = this.scale.width;
    const H = this.scale.height;

    x = Math.round(x / B) * B;
    y = Math.round(y / B) * B;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = DARKNESS_COLOR;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const startCol = Math.floor((x - R) / B);
    const endCol = Math.ceil((x + R) / B);
    const startRow = Math.floor((y - R) / B);
    const endRow = Math.ceil((y + R) / B);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const bx = col * B + B / 2;
        const by = row * B + B / 2;
        const dist = Math.sqrt((bx - x) * (bx - x) + (by - y) * (by - y));

        if (dist > R) continue;

        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(col * B, row * B, B, B);
      }
    }

    ctx.restore();

    this.darknessTexture.refresh();
  }

  _setupInput() {
    setupHeldKeyInput(this);
  }

  _processHeldMovement(time) {
    processHeldMovement(this, time, (key) => this._handleMove(key), {
      setPlayerRunning: () => this._setPlayerRunning(),
      setPlayerIdle: () => this._setPlayerIdle(),
    });
  }

  _updateRathSound() {
    if (!this.rathSound) return;

    const player = this.playerPos;
    let minDist = Infinity;

    for (const obstacle of this.obstacles) {
      const r = obstacle.currentCell.r;
      const c = obstacle.currentCell.c;

      const dist = Math.abs(player.r - r) + Math.abs(player.c - c);
      if (dist < minDist) minDist = dist;
    }

    const { maxHearDist, maxVolume, smoothing } = audio.rath;

    const proximity = Phaser.Math.Clamp(1 - minDist / maxHearDist, 0, 1);
    const easedProximity = proximity * proximity * (3 - 2 * proximity);
    const targetVolume = easedProximity * maxVolume;

    this.currentRathVolume = Phaser.Math.Linear(
      this.currentRathVolume,
      targetVolume,
      smoothing,
    );

    this.rathSound.setVolume(this.currentRathVolume);
  }

  update(time) {
    if (!this.gameOver) {
      this._processHeldMovement(time);
    }

    if (this.gameOver) return;

    if (!this.obstacles.length) {
      this._updateFlashlight();
      return;
    }

    let hitPlayer = false;

    for (const obstacle of this.obstacles) {
      const routeLength = obstacle.route.length;
      if (!routeLength) continue;

      const step =
        Math.floor(time / obstacle.moveMs + obstacle.phase) % routeLength;
      obstacle.currentIndex = step;
      obstacle.currentCell = obstacle.route[step];

      if (
        obstacle.currentCell.r === this.playerPos.r &&
        obstacle.currentCell.c === this.playerPos.c
      ) {
        hitPlayer = true;
      }
    }

    this._drawObstacles();
    this._updateFlashlight();
    this._updateRathSound();

    if (hitPlayer) {
      this._triggerGameOver();
    }
  }

  _handleMove(key) {
    if (this.gameOver) return;

    const { r, c } = this.playerPos;
    const cell = this.grid[r * this.ncols + c];

    let nr = r;
    let nc = c;
    let hitWall = false;

    if (key === "ArrowUp" || key === "w") {
      if (cell.walls[0]) hitWall = true;
      else nr--;
    } else if (key === "ArrowRight" || key === "d") {
      if (cell.walls[1]) hitWall = true;
      else {
        nc++;
        this.lastDirection = 1;
        if (this.playerSprite) this.playerSprite.setFlipX(false);
      }
    } else if (key === "ArrowDown" || key === "s") {
      if (cell.walls[2]) hitWall = true;
      else nr++;
    } else if (key === "ArrowLeft" || key === "a") {
      if (cell.walls[3]) hitWall = true;
      else {
        nc--;
        this.lastDirection = -1;
        if (this.playerSprite) this.playerSprite.setFlipX(true);
      }
    }

    if (hitWall) {
      this._playImpactSound();
      return;
    }

    if (this._isObstacleAt(nr, nc)) {
      this._triggerGameOver();
      return;
    }

    if (nr !== r || nc !== c) {
      this.playerPos = { r: nr, c: nc };
      this._drawPlayer();
      this._playFootstepSound();
      this._setPlayerRunning();

      for (const collectible of this.collectibles) {
        if (!collectible.matchesCell(nr, nc)) continue;

        if (collectible.collect()) {
          this.collectedCount++;
          this.collectSound.play();
          this._showCollectNotification();
          this._updateCollectiblesHUD();
          this._emitCollectibleProgress();
        }
      }

      this._updateFlashlight();
      this._checkWin();
    }
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

  _playFootstepSound() {
    if (!this.footstepSound) return;

    this.footstepSound.stop();
    this.footstepSound.play();
  }

  _playImpactSound() {
    if (!this.impactSound) return;

    this.impactSound.stop();
    this.impactSound.play();
  }

  _isObstacleAt(r, c) {
    return this.obstacles.some(
      (obstacle) =>
        obstacle.currentCell.r === r && obstacle.currentCell.c === c,
    );
  }

  _showGameOverButtons() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 80;

    const buttonStyle = {
      fontFamily: "EarlyGameBoy",
      fontSize: "20px",
      color: colors.light,
      backgroundColor: colors.deep,
      padding: { x: 16, y: 10 },
    };

    const retryBtn = this.add
      .text(centerX - 100, centerY, "RETRY", buttonStyle)
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    const exitBtn = this.add
      .text(centerX + 100, centerY, "EXIT", buttonStyle)
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    retryBtn.on("pointerdown", () => {
      this.scene.stop("UIScene");
      this.scene.restart();
      this.scene.launch("UIScene", { level: 2 });
    });

    exitBtn.on("pointerdown", () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });

    [retryBtn, exitBtn].forEach((btn) => {
      btn.on("pointerover", () => btn.setScale(1.1));
      btn.on("pointerout", () => btn.setScale(1));
    });
  }

  _triggerGameOver() {
    if (this.gameOver) return;

    if (this.rathSound) {
      this.rathSound.stop();
    }

    this.gameOver = true;
    this.input.keyboard.removeAllListeners();

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        "You were hit by the jatra crowd!",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "28px",
          color: colors.light,
          backgroundColor: colors.panel,
          padding: { x: 18, y: 10 },
        },
      )
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH);

    this._showGameOverButtons();
  }

  _checkWin() {
    const { r, c } = this.playerPos;
    const { nrows, ncols } = this;

    if (r === nrows - 1 && c === ncols - 1) {
      if (this.rathSound) {
        this.rathSound.stop();
      }

      ProgressManager.completeLevel(2);

      if (this.levelCompletedSound) {
        this.levelCompletedSound.play();
      }

      this.input.keyboard.removeAllListeners();
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2 - 50,
          "🎉 You reached home!",
          {
            fontFamily: "EarlyGameBoy",
            fontSize: "36px",
            color: colors.light,
            backgroundColor: colors.deep,
            padding: { x: 20, y: 10 },
          },
        )
        .setOrigin(0.5)
        .setDepth(MESSAGE_DEPTH);

      this.time.delayedCall(2200, () => {
        this._showVictoryButtons();
      });
    }
  }

  _showVictoryButtons() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 80;

    const buttonStyle = {
      fontFamily: "EarlyGameBoy",
      fontSize: "20px",
      color: colors.light,
      backgroundColor: colors.deep,
      padding: { x: 16, y: 10 },
    };

    const nextBtn = this.add
      .text(centerX, centerY, "NEXT LEVEL", buttonStyle)
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH)
      .setInteractive({ useHandCursor: true });

    nextBtn.on("pointerdown", () => {
      this.scene.stop("UIScene");
      this.scene.start("LevelIntroScene", { level: 3 });
    });

    nextBtn.on("pointerover", () => nextBtn.setScale(1.1));
    nextBtn.on("pointerout", () => nextBtn.setScale(1));
  }
}