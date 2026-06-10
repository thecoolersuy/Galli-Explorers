import Phaser from "phaser";
import Cell from "../logic/Cell.js";
import MazeGenerator from "../logic/MazeGenerator.js";

const CELL_SIZE = 40;
const WALL_THICKNESS = 3;
const WALL_COLOR = 0x013236;
const VISITED_COLOR = 0x48bf6d;
const START_COLOR = 0x48bf6d;
const GOAL_COLOR = 0xf8fdbb;
const PLAYER_COLOR = 0xff6b6b;

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super("Level1Scene");
  }

  create() {
    // --- Grid dimensions based on screen ---
    this.CELL_SIZE = CELL_SIZE;
    this.ncols = Math.floor(this.scale.width / CELL_SIZE) - 1;
    this.nrows = Math.floor(this.scale.height / CELL_SIZE) - 2;

    // Offset to center the maze on screen
    this.offsetX = Math.floor((this.scale.width - this.ncols * CELL_SIZE) / 2);
    this.offsetY = Math.floor((this.scale.height - this.nrows * CELL_SIZE) / 2);

    this._buildMaze();
    this._drawMaze();
    this._setupPlayer();
    this._setupInput();
  }

  // ─── Build grid + generate maze instantly ───────────────────────────────────
  _buildMaze() {
    const { nrows, ncols } = this;
    this.grid = [];

    for (let i = 0; i < nrows; i++)
      for (let j = 0; j < ncols; j++)
        this.grid.push(new Cell(i, j, nrows, ncols));

    for (let cell of this.grid) cell.createNeighbors(this.grid);

    const gen = new MazeGenerator(this.grid, ncols);
    gen.generate(); // instant — no animation yet
  }

  // ─── Draw the maze using Phaser Graphics ────────────────────────────────────
  _drawMaze() {
    const { nrows, ncols, grid, offsetX, offsetY } = this;
    const S = CELL_SIZE;

    // Background fill for visited cells
    this.cellGraphics = this.add.graphics();

    for (let cell of grid) {
      const x = offsetX + cell.c * S;
      const y = offsetY + cell.r * S;
      this.cellGraphics.fillStyle(VISITED_COLOR, 0.15);
      this.cellGraphics.fillRect(x, y, S, S);
    }

    // Goal cell highlight
    const goal = grid[nrows * ncols - 1];
    this.cellGraphics.fillStyle(GOAL_COLOR, 0.5);
    this.cellGraphics.fillRect(
      offsetX + goal.c * S,
      offsetY + goal.r * S,
      S,
      S,
    );

    // Walls
    this.wallGraphics = this.add.graphics();
    this.wallGraphics.lineStyle(WALL_THICKNESS, WALL_COLOR, 1);

    for (let cell of grid) {
      const x = offsetX + cell.c * S;
      const y = offsetY + cell.r * S;

      if (cell.walls[0]) {
        // Top
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y);
        this.wallGraphics.lineTo(x + S, y);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[1]) {
        // Right
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x + S, y);
        this.wallGraphics.lineTo(x + S, y + S);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[2]) {
        // Bottom
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y + S);
        this.wallGraphics.lineTo(x + S, y + S);
        this.wallGraphics.strokePath();
      }
      if (cell.walls[3]) {
        // Left
        this.wallGraphics.beginPath();
        this.wallGraphics.moveTo(x, y);
        this.wallGraphics.lineTo(x, y + S);
        this.wallGraphics.strokePath();
      }
    }

    // Goal emoji label
    this.add
      .text(offsetX + goal.c * S + S / 2, offsetY + goal.r * S + S / 2, "🎩", {
        fontFamily: "EarlyGameBoy",
        fontSize: "22px",
      })
      .setOrigin(0.5);
  }

  // ─── Player ─────────────────────────────────────────────────────────────────
  _setupPlayer() {
    const { offsetX, offsetY } = this;
    const S = CELL_SIZE;

    this.playerPos = { r: 0, c: 0 }; // start top-left

    this.playerGraphic = this.add.graphics();
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

  // ─── Input ──────────────────────────────────────────────────────────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    // Prevent repeat firing — only move on fresh keydown
    this.input.keyboard.on("keydown", (event) => {
      this._handleMove(event.key);
    });
  }

  _handleMove(key) {
    const { r, c } = this.playerPos;
    const cell = this.grid[r * this.ncols + c];

    let nr = r,
      nc = c;

    if ((key === "ArrowUp" || key === "w") && !cell.walls[0]) nr--;
    if ((key === "ArrowRight" || key === "d") && !cell.walls[1]) nc++;
    if ((key === "ArrowDown" || key === "s") && !cell.walls[2]) nr++;
    if ((key === "ArrowLeft" || key === "a") && !cell.walls[3]) nc--;

    if (nr !== r || nc !== c) {
      this.playerPos = { r: nr, c: nc };
      this._drawPlayer();
      this._checkWin();
    }
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
        .setDepth(10);
    }
  }
}
