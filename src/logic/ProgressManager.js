// Centralized progress manager for tracking level completion via localStorage.
// Each completed level = 100 XP, max 500 XP (5 levels).

const STORAGE_KEY = "galli-explorer-progress";
const XP_PER_LEVEL = 100;
const MAX_XP = 500;
const TOTAL_LEVELS = 5;

export default class ProgressManager {
  static _getState() {
    const defaultState = {
      completed: [],
      spentXP: 0,
      selectedCharacter: "maicha",
      unlockedCharacters: ["maicha"],
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migrate old array format
        defaultState.completed = parsed.filter(n => Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS);
        return defaultState;
      }

      if (parsed && typeof parsed === "object") {
        const state = { ...defaultState, ...parsed };
        if (!state.unlockedCharacters.includes(state.selectedCharacter)) {
          state.selectedCharacter = "maicha";
        }
        return state;
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  }

  static _saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  static getCompletedLevels() {
    return new Set(ProgressManager._getState().completed);
  }

  static completeLevel(level) {
    const state = ProgressManager._getState();
    const completed = new Set(state.completed);
    completed.add(level);
    state.completed = [...completed];
    ProgressManager._saveState(state);
  }

  static getXP() {
    const state = ProgressManager._getState();
    const earnedXP = Math.min(state.completed.length * XP_PER_LEVEL, MAX_XP);
    return Math.max(0, earnedXP - state.spentXP);
  }

  static deductXP(amount) {
    const state = ProgressManager._getState();
    const currentXP = ProgressManager.getXP();
    if (currentXP >= amount) {
      state.spentXP += amount;
      ProgressManager._saveState(state);
      return true;
    }
    return false;
  }

  static getMaxXP() { return MAX_XP; }
  static getXPPerLevel() { return XP_PER_LEVEL; }

  static getNextLevel() {
    const completed = ProgressManager.getCompletedLevels();
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (!completed.has(i)) return i;
    }
    return 1;
  }

  static isAllCompleted() {
    return ProgressManager.getCompletedLevels().size >= TOTAL_LEVELS;
  }

  static unlockCharacter(id) {
    const state = ProgressManager._getState();
    if (!state.unlockedCharacters.includes(id)) {
      state.unlockedCharacters.push(id);
      ProgressManager._saveState(state);
    }
  }

  static isCharacterUnlocked(id) {
    return ProgressManager._getState().unlockedCharacters.includes(id);
  }

  static selectCharacter(id) {
    if (ProgressManager.isCharacterUnlocked(id)) {
      const state = ProgressManager._getState();
      state.selectedCharacter = id;
      ProgressManager._saveState(state);
    }
  }

  static getSelectedCharacter() {
    return ProgressManager._getState().selectedCharacter;
  }

  static reset() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
