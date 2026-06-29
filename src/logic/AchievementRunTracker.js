import AchievementManager from "./AchievementManager.js";
import ProgressManager from "./ProgressManager.js";

const LOADSHEDDING_TIME_MS = 3 * 60 * 1000;

function cellKey(r, c) {
  return `${r},${c}`;
}

function distToGoal(r, c, nrows, ncols) {
  return nrows - 1 - r + (ncols - 1 - c);
}

export default class AchievementRunTracker {
  constructor(scene, levelNumber) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.wallHits = 0;
    this.visitedCells = new Set();
    this.backtracked = false;
    this.jatraCleared = new Set();
  }

  recordWallHit() {
    this.wallHits += 1;
  }

  recordMove(from, to) {
    const toKey = cellKey(to.r, to.c);
    if (this.visitedCells.has(toKey)) {
      this.backtracked = true;
    }
    this.visitedCells.add(toKey);
    this.visitedCells.add(cellKey(from.r, from.c));
  }

  recordYomariCollected(count) {
    if (count >= 3) {
      AchievementManager.tryUnlock(this.scene, "yomari_lover");
    }
  }

  checkJatraDodger(obstacles, nrows, ncols) {
    if (!obstacles?.length) return;
    if (AchievementManager.isUnlocked("jatra_dodger")) return;

    const playerDist = distToGoal(
      this.scene.playerPos.r,
      this.scene.playerPos.c,
      nrows,
      ncols,
    );

    obstacles.forEach((obstacle, index) => {
      const route = obstacle.route ?? [];
      if (!route.length) return;

      const minObsDist = Math.min(
        ...route.map((cell) => distToGoal(cell.r, cell.c, nrows, ncols)),
      );

      if (playerDist < minObsDist) {
        this.jatraCleared.add(index);
      }
    });

    if (this.jatraCleared.size === obstacles.length) {
      AchievementManager.tryUnlock(this.scene, "jatra_dodger");
    }
  }

  onLevelComplete(elapsedMs) {
    if (this.wallHits === 0) {
      AchievementManager.tryUnlock(this.scene, "galli_expert");
    }

    if (!this.backtracked) {
      AchievementManager.tryUnlock(this.scene, "master_navigator");
    }

    if (this.levelNumber === 2 && elapsedMs < LOADSHEDDING_TIME_MS) {
      AchievementManager.tryUnlock(this.scene, "loadshedding_survivor");
    }

    if (ProgressManager.isAllCompleted()) {
      AchievementManager.tryUnlock(this.scene, "kathmandu_navigator");
    }
  }
}
