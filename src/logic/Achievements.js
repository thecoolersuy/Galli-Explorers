export const ACHIEVEMENT_XP = 50;

export const ACHIEVEMENTS = [
  {
    id: "galli_expert",
    title: "Galli Expert",
    description: "Complete a maze without taking a wrong turn.",
    badge: "character",
  },
  {
    id: "loadshedding_survivor",
    title: "Loadshedding Survivor",
    description: "Finish Level 2 in under 3 minutes.",
    badge: "character",
  },
  {
    id: "jatra_dodger",
    title: "Jatra Dodger",
    description: "Avoid all moving jatra obstacles.",
    badge: "jatra",
    midGame: true,
  },
  {
    id: "kathmandu_navigator",
    title: "Kathmandu Navigator",
    description: "Complete all 5 levels.",
    badge: "character",
  },
  {
    id: "master_navigator",
    title: "Master Navigator",
    description: "Reach home without backtracking.",
    badge: "jatra",
  },
  {
    id: "yomari_lover",
    title: "Yomari Lover",
    description: "Collect 3 Yomaris in a level.",
    badge: "yomari",
    midGame: true,
  },
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
