import BaseMazeScene from "./BaseMazeScene.js";
import RathObstacle from "../sprites/RathObstacle.js";
import Phaser from "phaser";
import audio from "../styles/audio.js";

const RATH_MOVE_MS = 380;
const BALL_MOVE_MS = 320;

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
      "lakheypic",
      new URL("../assets/img/lakhey.png", import.meta.url).href,
    );
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
    this.rathRoutes = this._configureRathRoutes();
    this.redBallStart = {
      r: 1,
      c: 1,
    };
    this._openRathRing(this.redBallStart.r, this.redBallStart.c);
  }

  _setupLevelObjects() {
    // Setup raths with position tracking
    this.rathObstacles = this.rathRoutes.map(
      (route, index) =>
        new RathObstacle(this, {
          route,
          phase: index * 2,
          moveMs: RATH_MOVE_MS + index * 70,
        }),
    );

    // Initialize rath position tracking
    for (const rath of this.rathObstacles) {
      rath.currentCell = rath.route[0];
    }

    // Setup single red ball (Lakhey)
    this.redBalls = [{
      currentCell: { ...this.redBallStart },
      sprite: null,
    }];

    this._createBallSprites();

    // Initialize chase state variables
    this.playerHasMoved = false;
    this.isChasing = false;
    this.lastChaseMoveTime = 0;

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.currentRathVolume = 0;
    this.rathSound.play();
  }

  _createBallSprites() {
    for (const ball of this.redBalls) {
      ball.sprite = this.add.image(0, 0, "lakheypic");
      ball.sprite.setOrigin(0.5);
      ball.sprite.setDepth(25);
      ball.sprite.setScale(0.15);
    }
  }

  _drawBalls() {
    for (const ball of this.redBalls) {
      const { x, y } = this._cellCenter(ball.currentCell.r, ball.currentCell.c);
      ball.sprite.setPosition(x, y);
    }
  }

  _updateLevel(time) {
    // Update raths and track their positions
    for (const rath of this.rathObstacles) {
      rath.update(time);

      // Track current cell position for each rath based on their route
      // Calculate which step in the route the rath should be at
      const routeLength = rath.route ? rath.route.length : 0;
      if (routeLength > 0) {
        const step =
          Math.floor(time / rath.moveMs + rath.phase) % routeLength;
        rath.currentCell = rath.route[step];
      }
    }

    // Update chasing red ball (Lakhey)
    if (this.isChasing) {
      if (!this.lastChaseMoveTime) {
        this.lastChaseMoveTime = time;
      }

      // Speed: medium (every 380ms)
      if (time - this.lastChaseMoveTime >= 250) {
        this.lastChaseMoveTime = time;

        const ball = this.redBalls[0];
        const path = this._findMazePath(ball.currentCell, this.playerPos);
        if (path && path.length > 1) {
          ball.currentCell = path[1];
        }
      }
    }

    this._drawBalls();

    // Check collision with player
    if (this._isHazardAt(this.playerPos.r, this.playerPos.c)) {
      this._triggerGameOver(this.gameOverText);
    }

    // Update sound based on proximity
    this._updateRathSound();
  }

  _afterPlayerMove(fromCell, toCell) {
    super._afterPlayerMove(fromCell, toCell);
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

    // Check distance to RATHS ONLY (not red balls)
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