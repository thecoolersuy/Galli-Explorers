import BaseMazeScene from "./BaseMazeScene.js";
import MazeKey from "../sprites/MazeKey.js";
import LockedGate from "../sprites/LockedGate.js";
import RathObstacle from "../sprites/RathObstacle.js";
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
    this.rathRoutes = this._configureRathRoutes();
  }

  _setupLevelObjects() {
    this.gate = new LockedGate(this, this.gateEdge);

    this.key = new MazeKey(this, {
      r: this.keyCell.r,
      c: this.keyCell.c,
      id: "level-4-key",
    });

    this.rathObstacles = this.rathRoutes.map(
      (route, index) =>
        new RathObstacle(this, {
          route,
          phase: index * 2,
          moveMs: 380 + index * 70,
        }),
    );

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.currentRathVolume = 0;
    this.rathSound.play();
  }

  _configureRathRoutes() {
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
      {
        r: Math.floor(this.nrows * 0.32),
        c: Math.floor(this.ncols * 0.78),
      },
      {
        r: Math.floor(this.nrows * 0.66),
        c: Math.floor(this.ncols * 0.22),
      },
      {
        r: Math.floor(this.nrows * 0.78),
        c: Math.floor(this.ncols * 0.68),
      },
    ];

    const routes = [];

    for (const { r, c } of anchors) {
      if (routes.length >= 3) break;

      if (
        r < 2 ||
        c < 2 ||
        r >= this.nrows - 2 ||
        c >= this.ncols - 2
      ) {
        continue;
      }

      const route = this._buildRathRoute(r, c);

      if (route.length < 4) continue;
      if (routes.some((existingRoute) => existingRoute[0].r === route[0].r && existingRoute[0].c === route[0].c)) {
        continue;
      }

      this._openRathRing(r, c);
      routes.push(route);
    }

    return routes;
  }

  _buildRathRoute(r, c) {
    const route = [
      { r: r - 1, c: c - 1 },
      { r: r - 1, c },
      { r: r - 1, c: c + 1 },
      { r, c: c + 1 },
      { r: r + 1, c: c + 1 },
      { r: r + 1, c },
      { r: r + 1, c: c - 1 },
      { r, c: c - 1 },
    ];

    return route.every(({ r: row, c: col }) => this._isRathRouteCellAllowed(row, col))
      ? route
      : [];
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

    if (
      this._isGateCell(r1, c1) ||
      this._isGateCell(r2, c2) ||
      this._isKeyCell(r1, c1) ||
      this._isKeyCell(r2, c2)
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

  _isHazardAt(r, c) {
    return this.rathObstacles
      ? this.rathObstacles.some((rath) => rath.occupiesCell(r, c))
      : false;
  }

  _updateRathSound() {
    if (!this.rathSound) return;

    let minDist = Infinity;

    for (const obstacle of this.rathObstacles) {
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
    if (!this.rathObstacles?.length) return;

    let hitPlayer = false;

    for (const obstacle of this.rathObstacles) {
      obstacle.update(time);

      if (
        obstacle.currentCell.r === this.playerPos.r &&
        obstacle.currentCell.c === this.playerPos.c
      ) {
        hitPlayer = true;
      }
    }

    this._updateRathSound(); // Sound volume increases as raths get closer

    if (hitPlayer) {
      this._triggerGameOver("You were hit by the jatra crowd!");
    }
  }

  _isGateCell(r, c) {
    if (!this.gateEdge) return false;

    return (
      (this.gateEdge.a.r === r && this.gateEdge.a.c === c) ||
      (this.gateEdge.b.r === r && this.gateEdge.b.c === c)
    );
  }

  _isKeyCell(r, c) {
    return this.keyCell?.r === r && this.keyCell?.c === c;
  }

  _isRathRouteCellAllowed(r, c) {
    return (
      r > 0 &&
      c > 0 &&
      r < this.nrows - 1 &&
      c < this.ncols - 1 &&
      !(r === 0 && c === 0) &&
      !(r === this.nrows - 1 && c === this.ncols - 1) &&
      !this._isGateCell(r, c) &&
      !this._isKeyCell(r, c)
    );
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
