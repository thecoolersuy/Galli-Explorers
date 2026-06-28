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

function makeBtn(scene, { x, y, label, onDown }) {
  const btnText = scene.add
    .text(x, y, label, {
      fontFamily: "EarlyGameBoy",
      fontSize: "17px",
      color: colors.dark,
      backgroundColor: colors.accent,
      padding: { x: 16, y: 10 },
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(SCORE_DEPTH + 2)
    .setInteractive({ useHandCursor: true });

  btnText.on("pointerover", () => {
    btnText.setBackgroundColor(colors.dark);
    btnText.setColor(colors.accent);
  });
  btnText.on("pointerout", () => {
    btnText.setBackgroundColor(colors.accent);
    btnText.setColor(colors.dark);
  });
  btnText.on("pointerdown", onDown);
  return btnText;
}

/**
 * @param {Phaser.Scene} scene
 * @param {{
 *   elapsedMs: number,
 *   yomariCollected: number,
 *   totalYomari?: number,
 *   isLose?: boolean,
 *   nextLevel?: string | null,
 *   onContinue?: () => void,
 *   onGoHome?: () => void,
 *   onRetry?: () => void,
 *   showContinueDelay?: number,
 * }} opts
 */
export function showLevelScoreScreen(scene, {
  elapsedMs,
  yomariCollected,
  totalYomari = 3,
  isLose = false,
  nextLevel = null,
  onContinue,
  onGoHome,
  onRetry,
  showContinueDelay = 1600,
}) {
  const score = calculateScore(elapsedMs, yomariCollected, totalYomari);
  const { width, height } = scene.scale;
  const layout = getGateLayout(width, height);
  const anchors = getGateTextAnchors(layout);
  const { unit, originX, originY, centerX } = layout;

  const container = scene.add.container(0, 0).setDepth(SCORE_DEPTH);
  const overlayItems = [];

  // Full-screen backdrop
  const backdrop = scene.add.rectangle(
    centerX,
    height / 2,
    width,
    height,
    colors.bgNum,
    1,
  );
  container.add(backdrop);

  // Gate graphic
  const gateGraphics = scene.add.graphics();
  drawPixelGate(gateGraphics, originX, originY, unit);
  container.add(gateGraphics);

  const titleFontSize = `${Math.max(22, Math.floor(unit * 3.1))}px`;
  const statsFontSize = `${Math.max(18, Math.floor(unit * 2))}px`;
  const totalFontSize = `${Math.max(24, Math.floor(unit * 2.8))}px`;

  // ── Title: "YOU LOSE" in red or "YOUR SCORE" in accent ──
  const titleText = isLose ? "YOU LOSE" : "YOUR SCORE";
  const titleColor = isLose ? colors.accent : colors.accent;
  const titleShadowColor = isLose ? "#6b0b02" : colors.dark;

  addDropShadowTitle(scene, container, centerX, anchors.titleY, titleText, {
    fontSize: titleFontSize,
    color: titleColor,
    shadowColor: titleShadowColor,
    strokeThickness: Math.max(10, Math.floor(unit * 1.1)),
    shadowOffset: Math.max(4, Math.floor(unit * 0.55)),
  });

  // ── Stats ──
  const statsText = scene.add
    .text(
      centerX,
      anchors.statsY,
      `Timing: ${score.timingFormatted}\nYomari collected: \n ${score.yomariCollected}/${score.totalYomari}`,
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

  // ── Total Score ──
  addDropShadowTitle(scene, container, centerX, anchors.totalY, `Total Score: ${score.totalScore}`, {
    fontSize: totalFontSize,
    color: colors.bg,
    shadowColor: colors.deep,
    strokeThickness: Math.max(12, Math.floor(unit * 1.35)),
    shadowOffset: Math.max(5, Math.floor(unit * 0.6)),
  });

  // ── Buttons (delayed) ──
  scene.time.delayedCall(showContinueDelay, () => {
    const btnY = anchors.continueY;
    const gap = Math.max(85, unit * 10);

    function destroyAll() {
      container.destroy();
      overlayItems.forEach((item) => item.destroy());
    }

    if (isLose) {
      // [RETRY]   [HOME]
      const retryBtn = makeBtn(scene, {
        x: centerX - gap / 2,
        y: btnY,
        label: "RETRY",
        onDown: () => { destroyAll(); onRetry?.(); },
      });
      const homeBtn = makeBtn(scene, {
        x: centerX + gap / 2,
        y: btnY,
        label: "HOME",
        bgColor: colors.panel,
        onDown: () => { destroyAll(); onGoHome?.(); },
      });
      overlayItems.push(retryBtn, homeBtn);
    } else if (nextLevel) {
      // [HOME]   [NEXT LEVEL]
      const homeBtn = makeBtn(scene, {
        x: centerX - gap / 2,
        y: btnY,
        label: "HOME",
        bgColor: colors.panel,
        onDown: () => { destroyAll(); onGoHome?.(); },
      });
      const nextBtn = makeBtn(scene, {
        x: centerX + gap / 2,
        y: btnY,
        label: "NEXT",
        onDown: () => { destroyAll(); onContinue?.(); },
      });
      overlayItems.push(homeBtn, nextBtn);
    } else {
      // Last level — only [HOME]
      const homeBtn = makeBtn(scene, {
        x: centerX,
        y: btnY,
        label: "HOME",
        bgColor: colors.panel,
        onDown: () => { destroyAll(); onGoHome?.(); },
      });
      overlayItems.push(homeBtn);
    }
  });

  return { container, score };
}
