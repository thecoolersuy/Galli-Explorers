import Phaser from "phaser";
import Cell from "../logic/Cell.js";
import MazeGenerator from "../logic/MazeGenerator.js";

const CELL_SIZE = 45;
const WALL_THICKNESS = 8;
const WALL_COLOR = 0xacb64b;
const BORDER_THICKNESS = 8;
const BORDER_COLOR = 0x75953a;
const VISITED_COLOR = 0x48bf6d;
const GOAL_COLOR = 0xf8fdbb;
const PLAYER_COLOR = 0xff6b6b;
const OBSTACLE_FILL = 0xc48a3a;
const OBSTACLE_DARK = 0x5c3819;
const OBSTACLE_ACCENT = 0x2f5d2f;
const OBSTACLE_MOVE_MS = 380;
const DARKNESS_COLOR = "rgba(3, 4, 8, 1)";
const TORCH_CORE_RADIUS = 28;
const TORCH_RADIUS = 145;
const MAZE_DEPTH = 0;
const WALL_DEPTH = 10;
const GOAL_DEPTH = 15;
const OBSTACLE_DEPTH = 20;
const DARKNESS_DEPTH = 50;
const PLAYER_DEPTH = 60;
const MESSAGE_DEPTH = 80;

let darknessTextureId = 0;

export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super("Level2Scene");
  }

  preload() {
    this.load.image(
      "rath",
      new URL("../assets/img/rath.png", import.meta.url).href,
    );
  }

  create() {
    this.CELL_SIZE = CELL_SIZE;
    this.ncols = Math.floor(this.scale.width / CELL_SIZE) - 1;
    this.nrows = Math.floor(this.scale.height / CELL_SIZE) - 2;

    this.offsetX = Math.floor((this.scale.width - this.ncols * CELL_SIZE) / 2);
    this.offsetY = Math.floor((this.scale.height - this.nrows * CELL_SIZE) / 2);

    this.gameOver = false;

    this._buildMaze();
    this._placeObstacles();
    this._drawMaze();
    this._setupPlayer();
    this._setupFlashlight();
    this._setupInput();
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
          color: "#1b2e24",
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
    this.playerGraphic = this.add.graphics();
    this.playerGraphic.setDepth(PLAYER_DEPTH);
    this._drawPlayer();
  }

  _drawPlayer() {
    const { offsetX, offsetY, playerPos } = this;
    const S = CELL_SIZE;

    this.playerGraphic.clear();
    this.playerGraphic.fillStyle(PLAYER_COLOR, 1);
    this.playerGraphic.fillCircle(
      offsetX + playerPos.c * S + S / 2,
      offsetY + playerPos.r * S + S / 2,
      S / 2 - 6,
    );
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
    const { x, y } = this._getPlayerCenter();

    ctx.clearRect(0, 0, this.scale.width, this.scale.height);
    ctx.fillStyle = DARKNESS_COLOR;
    ctx.fillRect(0, 0, this.scale.width, this.scale.height);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const gradient = ctx.createRadialGradient(
      x,
      y,
      TORCH_CORE_RADIUS,
      x,
      y,
      TORCH_RADIUS,
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(0.38, "rgba(0, 0, 0, 0.88)");
    gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.34)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, TORCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.darknessTexture.refresh();
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    this.input.keyboard.on("keydown", (event) => {
      this._handleMove(event.key);
    });
  }

  update(time) {
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

    if ((key === "ArrowUp" || key === "w") && !cell.walls[0]) nr--;
    if ((key === "ArrowRight" || key === "d") && !cell.walls[1]) nc++;
    if ((key === "ArrowDown" || key === "s") && !cell.walls[2]) nr++;
    if ((key === "ArrowLeft" || key === "a") && !cell.walls[3]) nc--;

    if (this._isObstacleAt(nr, nc)) {
      this._triggerGameOver();
      return;
    }

    if (nr !== r || nc !== c) {
      this.playerPos = { r: nr, c: nc };
      this._drawPlayer();
      this._updateFlashlight();
      this._checkWin();
    }
  }

  _isObstacleAt(r, c) {
    return this.obstacles.some(
      (obstacle) =>
        obstacle.currentCell.r === r && obstacle.currentCell.c === c,
    );
  }

  _triggerGameOver() {
    if (this.gameOver) return;

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
          color: "#f8fdbb",
          backgroundColor: "#5d4020",
          padding: { x: 18, y: 10 },
        },
      )
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH);
  }

  _checkWin() {
    const { r, c } = this.playerPos;
    const { nrows, ncols } = this;

    if (r === nrows - 1 && c === ncols - 1) {
      this.input.keyboard.removeAllListeners();
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          "🎉 You reached the hat!",
          {
            fontFamily: "EarlyGameBoy",
            fontSize: "36px",
            color: "#f8fdbb",
            backgroundColor: "#013236",
            padding: { x: 20, y: 10 },
          },
        )
        .setOrigin(0.5)
        .setDepth(MESSAGE_DEPTH);
    }
  }
}
