import colors from "../styles/colors.js";
import { calculateScore } from "../logic/ScoreCalculator.js";
import { drawPixelGate, getGateLayout, getGateTextAnchors } from "./PixelGate.js";

const SCORE_DEPTH = 250;

function addDropShadowTitle(scene, container, x, y, text, {
  fontSize,
  color = colors.accent,
  shadowColor = colors.dark,
  shadowOffset = 5,
  strokeThickness = 14,
} = {}) {
  const config = {
    fontFamily: "EarlyGameBoy",
    fontSize,
    align: "center",
    stroke: colors.dark,
    strokeThickness,
  };

  const shadow = scene.add.text(x + shadowOffset, y + shadowOffset, text, {
    ...config,
    color: shadowColor,
  }).setOrigin(0.5);

  const main = scene.add.text(x, y, text, {
    ...config,
    color,
  }).setOrigin(0.5);

  container.add([shadow, main]);
  return main;
}

export function showLevelScoreScreen(scene, {
  elapsedMs,
  yomariCollected,
  totalYomari = 3,
  onContinue,
  showContinueDelay = 1600,
}) {
  const score = calculateScore(elapsedMs, yomariCollected, totalYomari);
  const { width, height } = scene.scale;
  const layout = getGateLayout(width, height);
  const anchors = getGateTextAnchors(layout);
  const { unit, originX, originY, centerX } = layout;

  const container = scene.add.container(0, 0).setDepth(SCORE_DEPTH);
  const overlayItems = [];

  const backdrop = scene.add.rectangle(
    centerX,
    height / 2,
    width,
    height,
    colors.bgNum,
    1,
  );
  container.add(backdrop);

  const gateGraphics = scene.add.graphics();
  drawPixelGate(gateGraphics, originX, originY, unit);
  container.add(gateGraphics);

  const titleFontSize = `${Math.max(22, Math.floor(unit * 3.1))}px`;
  const statsFontSize = `${Math.max(18, Math.floor(unit * 2))}px`;
  const totalFontSize = `${Math.max(24, Math.floor(unit * 2.8))}px`;

  addDropShadowTitle(scene, container, centerX, anchors.titleY, "YOUR SCORE", {
    fontSize: titleFontSize,
    color: colors.accent,
    strokeThickness: Math.max(10, Math.floor(unit * 1.1)),
    shadowOffset: Math.max(4, Math.floor(unit * 0.55)),
  });

  const statsText = scene.add
    .text(
      centerX,
      anchors.statsY,
      `Timing: ${score.timingFormatted}\nYomari collected: ${score.yomariCollected}/${score.totalYomari}`,
      {
        fontFamily: "EarlyGameBoy",
        fontSize: statsFontSize,
        color: colors.textDark,
        align: "center",
        lineSpacing: Math.max(10, Math.floor(unit * 1)),
      },
    )
    .setOrigin(0.5);
  container.add(statsText);

  addDropShadowTitle(scene, container, centerX, anchors.totalY, `Total Score: ${score.totalScore}`, {
    fontSize: totalFontSize,
    color: colors.bg,
    shadowColor: colors.deep,
    strokeThickness: Math.max(12, Math.floor(unit * 1.35)),
    shadowOffset: Math.max(5, Math.floor(unit * 0.6)),
  });

  scene.time.delayedCall(showContinueDelay, () => {
    const continueButton = scene.add
      .text(centerX, anchors.continueY, "CONTINUE >>>", {
        fontFamily: "EarlyGameBoy",
        fontSize: "20px",
        color: colors.light,
        backgroundColor: colors.deep,
        padding: { x: 20, y: 12 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(SCORE_DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    overlayItems.push(continueButton);

    continueButton.on("pointerover", () => continueButton.setScale(1.06));
    continueButton.on("pointerout", () => continueButton.setScale(1));
    continueButton.on("pointerdown", () => {
      container.destroy();
      overlayItems.forEach((item) => item.destroy());
      onContinue?.();
    });
  });

  return { container, score };
}
