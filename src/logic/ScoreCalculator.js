export const MAX_SCORE = 100;
export const YOMARI_POINTS_EACH = 10;
export const MAX_TIME_POINTS = 70;

export function formatElapsedTime(elapsedMs) {
  return String(Math.max(0, Math.floor(elapsedMs / 1000)));
}

export function calculateScore(elapsedMs, yomariCollected, totalYomari = 3) {
  const yomariPoints = Math.min(
    yomariCollected * YOMARI_POINTS_EACH,
    totalYomari * YOMARI_POINTS_EACH,
  );
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const timePoints = Math.max(0, MAX_TIME_POINTS - elapsedSeconds);
  const totalScore = Math.min(MAX_SCORE, yomariPoints + timePoints);

  return {
    timingFormatted: formatElapsedTime(elapsedMs),
    yomariCollected,
    totalYomari,
    yomariPoints,
    timePoints,
    totalScore,
  };
}
