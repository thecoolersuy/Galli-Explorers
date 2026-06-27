import BaseMazeScene from "./BaseMazeScene.js";
import MazeKey from "../sprites/MazeKey.js";
import LockedGate from "../sprites/LockedGate.js";
import RathObstacle from "../sprites/RathObstacle.js";
import MazeCollectible from "../sprites/MazeCollectible.js";
import Phaser from "phaser";
import audio from "../styles/audio.js";

const TOTAL_KEYS = 3;
const TOTAL_COLLECTIBLES = 3;
const RATH_MOVE_MS = 380;

export default class Level5Scene extends BaseMazeScene {
  constructor() {
    super("Level5Scene", {
      level: 5,
    });
  }

  preload() {
    super.preload();

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
    const goal = { r: this.nrows - 1, c: this.ncols - 1 };
    const path = this._findMazePath({ r: 0, c: 0 }, goal);
    const gateIndex = Math.max(3, Math.floor(path.length * 0.7));

    this.collectedKeys = 0;
    this.gateEdge = {
      a: path[gateIndex],
      b: path[Math.min(gateIndex + 1, path.length - 1)],
    };
    this.keyCells = this._chooseKeyCells(this.gateEdge);
    this.rathRoutes = this._configureRathRoutes();
  }

  _setupLevelObjects() {
    this.gate = new LockedGate(this, this.gateEdge);
    this.keys = this.keyCells.map(
      (cell, index) =>
        new MazeKey(this, {
          r: cell.r,
          c: cell.c,
          id: `level-5-key-${index + 1}`,
        }),
    );

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

    this.collectedCount = 0;
    this._chooseCollectibleCells();
    this._setupCollectiblesHUD();

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.collectSound = this.sound.add("collect-yomari", {
      volume: 0.45,
    });

    this.currentRathVolume = 0;
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
      onComplete: () => notification.destroy(),
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
        !this._isGateCell(r, c) &&
        !this._isKeySpawnCell(r, c) &&
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

  _isGateCell(r, c) {
    if (!this.gateEdge) return false;
    return (
      (this.gateEdge.a.r === r && this.gateEdge.a.c === c) ||
      (this.gateEdge.b.r === r && this.gateEdge.b.c === c)
    );
  }

  _isKeySpawnCell(r, c) {
    if (!this.keyCells) return false;
    return this.keyCells.some((cell) => cell.r === r && cell.c === c);
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

  _canEnterCell(fromCell, toCell) {
    if (this._isRathAt(toCell.r, toCell.c)) return false;
    return !this.gate || !this.gate.blocksMove(fromCell, toCell);
  }

  _afterPlayerMove(_fromCell, _toCell) {
    const { r, c } = this.playerPos;

    // Check yomari collection
    for (const collectible of this.collectibles) {
      if (!collectible.matchesCell(r, c)) continue;

      if (collectible.collect()) {
        this.collectedCount++;
        this.collectSound.play();
        this._showCollectNotification();
        this._updateCollectiblesHUD();
        this._emitCollectibleProgress();
      }
    }

    // Check key collection
    for (const key of this.keys) {
      if (key.collected) continue;
      if (key.cell.r !== r || key.cell.c !== c) continue;

      if (key.collect()) {
        this.collectedKeys += 1;
        this._emitKeyProgress();
      }
    }

    // Open gate once all keys collected
    if (this.collectedKeys === TOTAL_KEYS && this.gate && this.gate.locked) {
      this.gate.open();
    }

    // Check rath collision after move
    if (this._isRathAt(r, c)) {
      this._triggerGameOver("Rath hit you!");
    }
  }

  _updateLevel(time) {
    if (!this.rathObstacles?.length) return;

    for (const rath of this.rathObstacles) {
      rath.update(time);

      const routeLength = rath.route ? rath.route.length : 0;
      if (routeLength > 0) {
        const step =
          Math.floor(time / rath.moveMs + rath.phase) % routeLength;
        rath.currentCell = rath.route[step];
      }

      if (
        rath.currentCell.r === this.playerPos.r &&
        rath.currentCell.c === this.playerPos.c
      ) {
        this._triggerGameOver("Rath hit you!");
      }
    }

    this._updateRathSound();
  }

  _updateRathSound() {
    if (!this.rathSound) return;

    let minDist = Infinity;

    for (const rath of this.rathObstacles) {
      if (!rath.currentCell) continue;

      const dist =
        Math.abs(this.playerPos.r - rath.currentCell.r) +
        Math.abs(this.playerPos.c - rath.currentCell.c);

      if (dist < minDist) minDist = dist;
    }

    const { maxHearDist, maxVolume, smoothing } = audio.rath;

    const proximity = Phaser.Math.Clamp(1 - minDist / maxHearDist, 0, 1);
    const eased = proximity * proximity * (3 - 2 * proximity);
    const targetVolume = eased * maxVolume;

    this.currentRathVolume = Phaser.Math.Linear(
      this.currentRathVolume,
      targetVolume,
      smoothing,
    );

    this.rathSound.setVolume(this.currentRathVolume);
  }

  _isRathAt(r, c) {
    return this.rathObstacles
      ? this.rathObstacles.some((rath) => rath.occupiesCell(r, c))
      : false;
  }

  _stopLevelAudio() {
    if (this.rathSound) {
      this.rathSound.stop();
    }
  }

  _configureRathRoutes() {
    const anchors = [
      { r: Math.floor(this.nrows * 0.35), c: Math.floor(this.ncols * 0.65) },
      { r: Math.floor(this.nrows * 0.70), c: Math.floor(this.ncols * 0.35) },
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

  _getUiData() {
    return {
      level: 5,
      totalKeys: TOTAL_KEYS,
    };
  }

  _emitKeyProgress() {
    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.events.emit("keysChanged", this.collectedKeys, TOTAL_KEYS);
    }
  }

  _chooseKeyCells(gateEdge) {
    const reachable = this._getReachableCells({ r: 0, c: 0 }, gateEdge);
    const blocked = new Set([
      this._cellKey(0, 0),
      this._cellKey(this.nrows - 1, this.ncols - 1),
      this._cellKey(gateEdge.a.r, gateEdge.a.c),
      this._cellKey(gateEdge.b.r, gateEdge.b.c),
    ]);
    const candidates = reachable.filter((cell) => {
      const gateDist =
        Math.abs(cell.r - gateEdge.a.r) + Math.abs(cell.c - gateEdge.a.c);

      return (
        !blocked.has(this._cellKey(cell.r, cell.c)) &&
        Math.abs(cell.r) + Math.abs(cell.c) > 4 &&
        gateDist >= 3
      );
    });
    const pool = candidates.length >= TOTAL_KEYS ? candidates : reachable;
    const anchors = [
      { r: Math.floor(this.nrows * 0.22), c: Math.floor(this.ncols * 0.78) },
      { r: Math.floor(this.nrows * 0.62), c: Math.floor(this.ncols * 0.25) },
      { r: Math.floor(this.nrows * 0.48), c: Math.floor(this.ncols * 0.58) },
    ];
    const selected = [];

    for (const anchor of anchors) {
      const next = this._nearestUnusedCell(pool, anchor, selected);
      if (next) selected.push(next);
    }

    if (selected.length < TOTAL_KEYS) {
      const remaining = [...pool].sort((a, b) => {
        const distA = Math.abs(a.r) + Math.abs(a.c);
        const distB = Math.abs(b.r) + Math.abs(b.c);
        return distB - distA;
      });

      for (const cell of remaining) {
        if (selected.length === TOTAL_KEYS) break;
        if (selected.some((chosen) => this._sameCell(chosen, cell))) continue;
        selected.push(cell);
      }
    }

    return selected.slice(0, TOTAL_KEYS);
  }

  _nearestUnusedCell(cells, anchor, selected) {
    let best = null;
    let bestScore = Infinity;

    for (const cell of cells) {
      if (selected.some((chosen) => this._sameCell(chosen, cell))) continue;

      const nearestSelectedDist = selected.length
        ? Math.min(
            ...selected.map(
              (chosen) =>
                Math.abs(chosen.r - cell.r) + Math.abs(chosen.c - cell.c),
            ),
          )
        : Infinity;

      if (nearestSelectedDist < 4) continue;

      const anchorDist =
        Math.abs(anchor.r - cell.r) + Math.abs(anchor.c - cell.c);

      if (anchorDist < bestScore) {
        best = cell;
        bestScore = anchorDist;
      }
    }

    return best;
  }
}