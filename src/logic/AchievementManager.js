import ProgressManager from "./ProgressManager.js";
import { ACHIEVEMENTS, getAchievementById } from "./Achievements.js";
import { showAchievementPopup } from "../ui/AchievementPopup.js";

export default class AchievementManager {
  static isUnlocked(id) {
    const state = ProgressManager._getState();
    return (state.achievements ?? []).includes(id);
  }

  static getUnlockedIds() {
    const state = ProgressManager._getState();
    return state.achievements ?? [];
  }

  static getUnlockedCount() {
    return AchievementManager.getUnlockedIds().length;
  }

  static getAllWithStatus() {
    const unlocked = new Set(AchievementManager.getUnlockedIds());
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: unlocked.has(achievement.id),
    }));
  }

  static tryUnlock(scene, id) {
    if (AchievementManager.isUnlocked(id)) return false;

    const achievement = getAchievementById(id);
    if (!achievement) return false;

    const state = ProgressManager._getState();
    if (!state.achievements) state.achievements = [];
    state.achievements.push(id);
    ProgressManager._saveState(state);

    if (scene) {
      showAchievementPopup(scene, achievement);
    }

    return true;
  }
}
