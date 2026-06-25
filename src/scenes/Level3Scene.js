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
    this.ballRoutes = this._configureBallRoutes();
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

    // Setup red balls
    this.redBalls = this.ballRoutes.map((route, index) => ({
      route,
      phase: index * 3,
      moveMs: BALL_MOVE_MS + index * 60,
      currentCell: route[0],
      sprite: null,
    }));

    this._createBallSprites();

    this.rathSound = this.sound.add("rath-dhim", {
      loop: true,
      volume: 0,
    });

    this.currentRathVolume = 0;
    this.rathSound.play();
  }

  _createBallSprites() {
    const textureKey = "red-ball";

    // Create red ball texture if it doesn't exist
    if (!this.textures.exists(textureKey)) {
      const canvas = this.textures.createCanvas(
        textureKey,
        Math.round(this.CELL_SIZE * 1.2),
        Math.round(this.CELL_SIZE * 1.2),
      );

      const ctx = canvas.context;
      const size = Math.round(this.CELL_SIZE * 1.2);
      const radius = size / 2;

      // Draw red ball with gradient
      const gradient = ctx.createRadialGradient(radius * 0.4, radius * 0.4, 0, radius, radius, radius);
      gradient.addColorStop(0, "#ff4444");
      gradient.addColorStop(0.7, "#cc0000");
      gradient.addColorStop(1, "#880000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
      ctx.fill();

      // Add shine effect
      ctx.fillStyle = "rgba(255, 200, 200, 0.4)";
      ctx.beginPath();
      ctx.arc(radius * 0.5, radius * 0.5, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    }

    // Create sprites for each red ball
    for (const ball of this.redBalls) {
      ball.sprite = this.add.image(0, 0, textureKey);
      ball.sprite.setOrigin(0.5);
      ball.sprite.setDepth(25);
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

    // Update red balls
    for (const ball of this.redBalls) {
      const step =
        Math.floor(time / ball.moveMs + ball.phase) % ball.route.length;
      ball.currentCell = ball.route[step];
    }

    this._drawBalls();

    // Check collision with player
    if (this._isHazardAt(this.playerPos.r, this.playerPos.c)) {
      this._triggerGameOver(this.gameOverText);
    }

    // Update sound based on proximity
    this._updateRathSound();
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

  _configureBallRoutes() {
    const anchors = [
      { r: Math.floor(this.nrows * 0.35), c: Math.floor(this.ncols * 0.50) },
      { r: Math.floor(this.nrows * 0.75), c: Math.floor(this.ncols * 0.45) },
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

      const route = this._buildBallRoute(anchor.r, anchor.c);
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

  _buildBallRoute(r, c) {
    // Red balls follow a slightly different pattern - larger circular path
    return [
      { r: r - 2, c: c - 2 },
      { r: r - 2, c: c - 1 },
      { r: r - 2, c },
      { r: r - 2, c: c + 1 },
      { r: r - 2, c: c + 2 },
      { r: r - 1, c: c + 2 },
      { r, c: c + 2 },
      { r: r + 1, c: c + 2 },
      { r: r + 2, c: c + 2 },
      { r: r + 2, c: c + 1 },
      { r: r + 2, c },
      { r: r + 2, c: c - 1 },
      { r: r + 2, c: c - 2 },
      { r: r + 1, c: c - 2 },
      { r, c: c - 2 },
      { r: r - 1, c: c - 2 },
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