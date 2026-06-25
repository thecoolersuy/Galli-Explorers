// Centralized progress manager for tracking level completion via localStorage.
// Each completed level = 100 XP, max 500 XP (5 levels).

const STORAGE_KEY = "galli-explorer-progress";
const XP_PER_LEVEL = 100;
const MAX_XP = 500;
const TOTAL_LEVELS = 5;

export default class ProgressManager {
  /**
   * Get the set of completed level numbers from localStorage.
   * @returns {Set<number>}
   */
  static getCompletedLevels() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS));
    } catch {
      return new Set();
    }
  }

  /**
   * Mark a level as completed and persist to localStorage.
   * @param {number} level
   */
  static completeLevel(level) {
    const completed = ProgressManager.getCompletedLevels();
    completed.add(level);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }

  /**
   * Get the current XP based on completed levels.
   * @returns {number}
   */
  static getXP() {
    return Math.min(ProgressManager.getCompletedLevels().size * XP_PER_LEVEL, MAX_XP);
  }

  /**
   * Get the maximum possible XP.
   * @returns {number}
   */
  static getMaxXP() {
    return MAX_XP;
  }

  /**
   * Get the XP earned per level.
   * @returns {number}
   */
  static getXPPerLevel() {
    return XP_PER_LEVEL;
  }

  /**
   * Get the next level to play (first uncompleted level, or 1 if none completed).
   * @returns {number}
   */
  static getNextLevel() {
    const completed = ProgressManager.getCompletedLevels();
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (!completed.has(i)) return i;
    }
    // All levels completed — return level 1 (replay from start)
    return 1;
  }

  /**
   * Check if all levels are completed.
   * @returns {boolean}
   */
  static isAllCompleted() {
    return ProgressManager.getCompletedLevels().size >= TOTAL_LEVELS;
  }

  /**
   * Reset all progress (for debugging or restart).
   */
  static reset() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
