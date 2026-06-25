import BaseMazeScene from "./BaseMazeScene.js";
import MazeKey from "../sprites/MazeKey.js";
import LockedGate from "../sprites/LockedGate.js";
import Phaser from "phaser";
import audio from "../styles/audio.js";

export default class Level4Scene extends BaseMazeScene {
  constructor() {
    super("Level4Scene", {
      level: 4,
      nextLevel: 5,
      gameOverText: "You were hit by the jatra crowd!",
    });
  }

  preload() {
    super.preload();

    this.load.image(
      "rath",
      new URL("../assets/img/rathbrown.png", import.meta.url).href,
    );

    this.load.audio(
      "rath-dhim",
      new URL("../assets/audio/rath-dhim.wav", import.meta.url).href,
    );
  }

  _configureLevel() {
    const goal = { r: this.nrows - 1, c: this.ncols - 1 };
    const path = this._findMazePath({ r: 0, c: 0 }, goal);
    const gateIndex = Math.max(2, Math.floor(path.length * 0.62));

    this.hasKey = false;

    this.gateEdge = {
      a: path[gateIndex],
      b: path[Math.min(gateIndex + 1, path.length - 1)],
    };

    this.keyCell = this._chooseKeyCell(this.gateEdge);
  }

  _setupLevelObjects() {
    this.gate = new LockedGate(this, this.gateEdge);

    this.key = new MazeKey(this, {
      r: this.keyCell.r,
      c: this.keyCell.c,
      id: "level-4-key",
    });

    this._setupRaths();

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.currentRathVolume = 0;
    this.rathSound.play();
  }

  _setupRaths() {
    const anchors = [
      {
        r: Math.floor(this.nrows * 0.22),
        c: Math.floor(this.ncols * 0.28),
      },
      {
        r: Math.floor(this.nrows * 0.50),
        c: Math.floor(this.ncols * 0.72),
      },
      {
        r: Math.floor(this.nrows * 0.72),
        c: Math.floor(this.ncols * 0.40),
      },
    ];

    this.obstacles = [];

    for (let i = 0; i < anchors.length; i++) {
      const { r, c } = anchors[i];

      const route = this._buildObstacleRoute(r, c);

      if (route.length < 4) continue;

      this.obstacles.push({
        route,
        phase: i * 2,
        moveMs: 380 + i * 70,
        currentCell: route[0],
      });
    }

    this._createObstacleSprites();
    this._drawObstacles();
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
        col < this.ncols - 1,
    );
  }

  _createObstacleSprites() {
    const textureKey = "rath-obstacle";
    const targetWidth = Math.round(this.CELL_SIZE * 1.8);
    const targetHeight = Math.round(this.CELL_SIZE * 1.8);

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
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      renderTexture.refresh();
    }

    for (const obstacle of this.obstacles) {
      obstacle.sprite = this.add.image(0, 0, textureKey);
      obstacle.sprite.setOrigin(0.5);
      obstacle.sprite.setDepth(50);
    }
  }

  _drawObstacles() {
    if (!this.obstacles) return;

    for (const obstacle of this.obstacles) {
      const { x, y } = this._cellCenter(
        obstacle.currentCell.r,
        obstacle.currentCell.c,
      );

      obstacle.sprite.setPosition(x, y);
    }
  }

  _isHazardAt(r, c) {
    return this.obstacles?.some(
      (obstacle) =>
        obstacle.currentCell.r === r &&
        obstacle.currentCell.c === c,
    );
  }

  _updateRathSound() {
    if (!this.rathSound) return;

    let minDist = Infinity;

    for (const obstacle of this.obstacles) {
      const dist =
        Math.abs(this.playerPos.r - obstacle.currentCell.r) +
        Math.abs(this.playerPos.c - obstacle.currentCell.c);

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

  _canEnterCell(fromCell, toCell) {
    return !this.gate || !this.gate.blocksMove(fromCell, toCell);
  }

  _afterPlayerMove(_fromCell, toCell) {
    if (this.key && this.key.matchesCell(toCell.r, toCell.c)) {
      this.hasKey = this.key.collect();
    }

    if (this.hasKey && this.gate && this.gate.locked) {
      this.gate.open();
    }
  }

  _updateLevel(time) {
    if (!this.obstacles?.length) return;

    let hitPlayer = false;

    for (const obstacle of this.obstacles) {
      const step =
        Math.floor(time / obstacle.moveMs + obstacle.phase) %
        obstacle.route.length;

      obstacle.currentCell = obstacle.route[step];

      if (
        obstacle.currentCell.r === this.playerPos.r &&
        obstacle.currentCell.c === this.playerPos.c
      ) {
        hitPlayer = true;
      }
    }

    this._drawObstacles();
    this._updateRathSound(); // Sound volume increases as raths get closer

    if (hitPlayer) {
      this._triggerGameOver("You were hit by the jatra crowd!");
    }
  }

  _stopLevelAudio() {
    if (this.rathSound) {
      this.rathSound.stop();
    }
  }

  _chooseKeyCell(gateEdge) {
    const reachable = this._getReachableCells({ r: 0, c: 0 }, gateEdge);

    const blocked = new Set([
      this._cellKey(0, 0),
      this._cellKey(this.nrows - 1, this.ncols - 1),
      this._cellKey(gateEdge.a.r, gateEdge.a.c),
      this._cellKey(gateEdge.b.r, gateEdge.b.c),
    ]);

    const candidates = reachable.filter((cell) => {
      const gateDist =
        Math.abs(cell.r - gateEdge.a.r) +
        Math.abs(cell.c - gateEdge.a.c);

      return (
        !blocked.has(this._cellKey(cell.r, cell.c)) &&
        Math.abs(cell.r) + Math.abs(cell.c) > 4 &&
        gateDist >= 4
      );
    });

    const pool = candidates.length ? candidates : reachable;

    let best = pool[0];
    let bestScore = -Infinity;

    for (const cell of pool) {
      const gateDist =
        Math.abs(cell.r - gateEdge.a.r) +
        Math.abs(cell.c - gateEdge.a.c);

      const startDist = Math.abs(cell.r) + Math.abs(cell.c);

      const score = startDist + gateDist;

      if (score > bestScore) {
        best = cell;
        bestScore = score;
      }
    }

    return best;
  }
}