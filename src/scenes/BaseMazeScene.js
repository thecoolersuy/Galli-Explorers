import Phaser from "phaser";
import Cell from "../logic/Cell.js";
import MazeGenerator from "../logic/MazeGenerator.js";
import colors from "../styles/colors.js";
import ProgressManager from "../logic/ProgressManager.js";
import {
  applyCharacterSpriteLayout,
  createCharacterWalkAnimation,
  getCharacterCellScale,
  getCharacterConfig,
  getCharacterRenderPosition,
} from "../logic/CharacterConfig.js";

const CELL_SIZE = 45;
const WALL_THICKNESS = 8;
const WALL_COLOR = colors.accentNum;
const BORDER_THICKNESS = 8;
const BORDER_COLOR = 0x7a5a34;
const VISITED_COLOR = 0x8f6b3a;
const GOAL_COLOR = colors.lightNum;

const MAZE_DEPTH = 0;
const WALL_DEPTH = 10;
const GOAL_DEPTH = 15;
const PLAYER_DEPTH = 60;
const MESSAGE_DEPTH = 80;

const DIRECTIONS = [
  { dr: -1, dc: 0, wall: 0 },
  { dr: 0, dc: 1, wall: 1 },
  { dr: 1, dc: 0, wall: 2 },
  { dr: 0, dc: -1, wall: 3 },
];

export default class BaseMazeScene extends Phaser.Scene {
  constructor(sceneKey, { level, nextLevel = null, gameOverText } = {}) {
    super(sceneKey);
    this.levelNumber = level;
    this.nextLevel = nextLevel;
    this.gameOverText = gameOverText || "Game Over!";
  }

  preload() {


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

    this.load.atlas(
      "player-girl",
      new URL("../assets/img/1.png", import.meta.url).href,
      new URL("../assets/img/1.json", import.meta.url).href
    );
  }

  create() {
    this.CELL_SIZE = CELL_SIZE;
    this.ncols = Math.max(8, Math.floor(this.scale.width / CELL_SIZE) - 1);
    this.nrows = Math.max(8, Math.floor(this.scale.height / CELL_SIZE) - 2);

    this.offsetX = Math.floor((this.scale.width - this.ncols * CELL_SIZE) / 2);
    this.offsetY = Math.floor((this.scale.height - this.nrows * CELL_SIZE) / 2);

    this.gameOver = false;
    this.levelComplete = false;
    this.playerCharacter = getCharacterConfig(ProgressManager.getSelectedCharacter());

    this._buildMaze();
    this._configureLevel();
    this._drawMaze();
    this._createPlayerAnimation();
    this._setupPlayer();
    this._setupSounds();
    this._setupLevelObjects();
    this._setupInput();
  }

  update(time, delta) {
    if (this.gameOver || this.levelComplete) return;

    this._updateLevel(time, delta);
  }

  _configureLevel() { }

  _setupLevelObjects() { }

  _updateLevel() { }

  _canEnterCell() {
    return true;
  }

  _afterPlayerMove() { }

  _isHazardAt() {
    return false;
  }

  _getUiData() {
    return { level: this.levelNumber };
  }

  _buildMaze() {
    const { nrows, ncols } = this;
    this.grid = [];

    for (let row = 0; row < nrows; row++) {
      for (let col = 0; col < ncols; col++) {
        this.grid.push(new Cell(row, col, nrows, ncols));
      }
    }

    for (const cell of this.grid) {
      cell.createNeighbors(this.grid);
    }

    const generator = new MazeGenerator(this.grid, ncols);
    generator.generate();
  }

  _drawMaze() {
    const { nrows, ncols, grid, offsetX, offsetY } = this;
    const S = CELL_SIZE;

    this.cellGraphics = this.add.graphics();
    this.cellGraphics.setDepth(MAZE_DEPTH);

    for (const cell of grid) {
      const x = offsetX + cell.c * S;
      const y = offsetY + cell.r * S;
      this.cellGraphics.fillStyle(VISITED_COLOR, 0.15);
      this.cellGraphics.fillRect(x, y, S, S);
    }

    this.goalCell = { r: nrows - 1, c: ncols - 1 };
    this.cellGraphics.fillStyle(GOAL_COLOR, 0.5);
    this.cellGraphics.fillRect(
      offsetX + this.goalCell.c * S,
      offsetY + this.goalCell.r * S,
      S,
      S,
    );

    this.wallGraphics = this.add.graphics();
    this.wallGraphics.setDepth(WALL_DEPTH);

    for (const cell of grid) {
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
        offsetX + this.goalCell.c * S + S / 2,
        offsetY + this.goalCell.r * S + S / 2,
        "GHAR",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "22px",
          color: colors.textDark,
        },
      )
      .setOrigin(0.5)
      .setDepth(GOAL_DEPTH);
  }

  _setupSounds() {
    this.footstepSound = this.sound.add("footsteps-wood", {
      volume: 2,
    });

    this.impactSound = this.sound.add("impact-plate", {
      volume: 0.5,
    });

    this.levelCompletedSound = this.sound.add("level-completed", {
      volume: 1,
    });
  }

  _setupPlayer() {
    this.playerPos = { r: 0, c: 0 };
    this.lastDirection = 1;
    this.isPlayerMoving = false;

    const scale = getCharacterCellScale(this.playerCharacter, CELL_SIZE);
    const cellCenter = this._cellCenter(this.playerPos.r, this.playerPos.c);
    const { x, y } = getCharacterRenderPosition(
      this.playerCharacter,
      cellCenter.x,
      cellCenter.y,
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

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    this.input.keyboard.on("keydown", (event) => {
      this._handleMove(event.key);
    });
  }

  _handleMove(rawKey) {
    if (this.gameOver || this.levelComplete) return;

    const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
    const fromCell = { ...this.playerPos };
    const cell = this.grid[fromCell.r * this.ncols + fromCell.c];

    let nr = fromCell.r;
    let nc = fromCell.c;
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
    } else {
      return;
    }

    const toCell = { r: nr, c: nc };

    if (hitWall || !this._canEnterCell(fromCell, toCell)) {
      this._playImpactSound();
      return;
    }

    if (this._isHazardAt(nr, nc)) {
      this._triggerGameOver(this.gameOverText);
      return;
    }

    if (nr !== fromCell.r || nc !== fromCell.c) {
      this.playerPos = toCell;
      this._drawPlayer();
      this._playFootstepSound();
      this._playWalkAnimation();
      this._afterPlayerMove(fromCell, toCell);

      if (this._isHazardAt(this.playerPos.r, this.playerPos.c)) {
        this._triggerGameOver(this.gameOverText);
        return;
      }

      this._checkWin();
    }
  }

  _drawPlayer() {
    const cellCenter = this._cellCenter(this.playerPos.r, this.playerPos.c);
    const { x, y } = getCharacterRenderPosition(
      this.playerCharacter,
      cellCenter.x,
      cellCenter.y,
      CELL_SIZE,
    );
    this.playerSprite.setPosition(x, y);
  }

  _playWalkAnimation() {
    this.isPlayerMoving = true;
    this._setPlayerRunning();

    if (this.playerMoveTimer) {
      this.playerMoveTimer.remove(false);
    }

    this.playerMoveTimer = this.time.delayedCall(280, () => {
      this.isPlayerMoving = false;
      this._setPlayerIdle();
    });
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

  _triggerGameOver(message = "Game Over!") {
    if (this.gameOver || this.levelComplete) return;

    this.gameOver = true;
    this._stopLevelAudio();
    this.input.keyboard.removeAllListeners();

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, {
        fontFamily: "EarlyGameBoy",
        fontSize: "28px",
        color: colors.light,
        backgroundColor: colors.panel,
        padding: { x: 18, y: 10 },
        align: "center",
        wordWrap: { width: Math.min(this.scale.width - 48, 760) },
      })
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH);

    this._showGameOverButtons();
  }

  _showGameOverButtons() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 80;

    this._createButton({
      x: centerX - 100,
      y: centerY,
      width: 150,
      height: 48,
      label: "RETRY",
      onClick: () => {
        this.scene.stop("UIScene");
        this.scene.restart();
        this.scene.launch("UIScene", this._getUiData());
      },
    });

    this._createButton({
      x: centerX + 100,
      y: centerY,
      width: 150,
      height: 48,
      label: "EXIT",
      onClick: () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      },
    });
  }

  _checkWin() {
    if (
      this.playerPos.r === this.goalCell.r &&
      this.playerPos.c === this.goalCell.c
    ) {
      this._completeLevel();
    }
  }

  _completeLevel() {
    if (this.levelComplete) return;

    this.levelComplete = true;
    this._stopLevelAudio();

    ProgressManager.completeLevel(this.levelNumber);

    if (this.levelCompletedSound) {
      this.levelCompletedSound.play();
    }

    this.input.keyboard.removeAllListeners();

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 50, "YOU REACHED HOME!", {
        fontFamily: "EarlyGameBoy",
        fontSize: "34px",
        color: colors.light,
        backgroundColor: colors.deep,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH);

    this.time.delayedCall(1400, () => {
      this._showVictoryButtons();
    });
  }

  _showVictoryButtons() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 80;

    if (this.nextLevel) {
      this._createButton({
        x: centerX,
        y: centerY,
        width: 220,
        height: 52,
        label: "NEXT LEVEL",
        onClick: () => {
          this.scene.stop("UIScene");
          this.scene.start("LevelIntroScene", { level: this.nextLevel });
        },
      });
      return;
    }

    this._createButton({
      x: centerX,
      y: centerY,
      width: 220,
      height: 52,
      label: "BACK TO MENU",
      onClick: () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      },
    });
  }

  _createButton({ x, y, width, height, label, onClick }) {
    const buttonStyle = {
      fontFamily: "EarlyGameBoy",
      fontSize: "16px",
      color: colors.light,
      backgroundColor: colors.deep,
      padding: { x: 14, y: 10 },
      align: "center",
    };

    const button = this.add
      .text(x, y, label, buttonStyle)
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", onClick);
    button.on("pointerover", () => button.setScale(1.08));
    button.on("pointerout", () => button.setScale(1));

    return button;
  }

  _stopLevelAudio() { }

  _cellCenter(r, c) {
    return {
      x: this.offsetX + c * CELL_SIZE + CELL_SIZE / 2,
      y: this.offsetY + r * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  _getOpenNeighborCells(r, c) {
    const cell = this.grid[r * this.ncols + c];
    if (!cell) return [];

    const neighbors = [];

    for (const direction of DIRECTIONS) {
      if (cell.walls[direction.wall]) continue;

      const nr = r + direction.dr;
      const nc = c + direction.dc;

      if (nr < 0 || nc < 0 || nr >= this.nrows || nc >= this.ncols) {
        continue;
      }

      neighbors.push({ r: nr, c: nc });
    }

    return neighbors;
  }

  _findMazePath(startCell, endCell, blockedEdge = null) {
    const start = { r: startCell.r, c: startCell.c };
    const end = { r: endCell.r, c: endCell.c };
    const endKey = this._cellKey(end.r, end.c);
    const queue = [start];
    const previous = new Map([[this._cellKey(start.r, start.c), null]]);

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      const currentKey = this._cellKey(current.r, current.c);

      if (currentKey === endKey) break;

      for (const neighbor of this._getOpenNeighborCells(current.r, current.c)) {
        if (blockedEdge && this._edgeMatches(blockedEdge, current, neighbor)) {
          continue;
        }

        const neighborKey = this._cellKey(neighbor.r, neighbor.c);
        if (previous.has(neighborKey)) continue;

        previous.set(neighborKey, current);
        queue.push(neighbor);
      }
    }

    if (!previous.has(endKey)) return [];

    const path = [];
    let cursor = end;

    while (cursor) {
      path.unshift(cursor);
      cursor = previous.get(this._cellKey(cursor.r, cursor.c));
    }

    return path;
  }

  _getReachableCells(startCell, blockedEdge = null) {
    const start = { r: startCell.r, c: startCell.c };
    const queue = [start];
    const visited = new Set([this._cellKey(start.r, start.c)]);

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];

      for (const neighbor of this._getOpenNeighborCells(current.r, current.c)) {
        if (blockedEdge && this._edgeMatches(blockedEdge, current, neighbor)) {
          continue;
        }

        const neighborKey = this._cellKey(neighbor.r, neighbor.c);
        if (visited.has(neighborKey)) continue;

        visited.add(neighborKey);
        queue.push(neighbor);
      }
    }

    return queue;
  }

  _edgeMatches(edge, fromCell, toCell) {
    return (
      (edge.a.r === fromCell.r &&
        edge.a.c === fromCell.c &&
        edge.b.r === toCell.r &&
        edge.b.c === toCell.c) ||
      (edge.b.r === fromCell.r &&
        edge.b.c === fromCell.c &&
        edge.a.r === toCell.r &&
        edge.a.c === toCell.c)
    );
  }

  _cellKey(r, c) {
    return `${r},${c}`;
  }

  _sameCell(a, b) {
    return a.r === b.r && a.c === b.c;
  }
}
