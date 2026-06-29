import Phaser from "phaser";
import colors from "../styles/colors.js";
import ProgressManager from "../logic/ProgressManager.js";
import { getCharacterConfig } from "../logic/CharacterConfig.js";

const POPUP_DEPTH = 300;

function addBadgeIcon(scene, container, x, y, size, badge, alpha = 1) {
  const frame = scene.add.rectangle(x, y, size, size, colors.panelNum, 1);
  frame.setStrokeStyle(3, colors.accentNum, 1);
  container.add(frame);

  let icon;
  if (badge === "yomari") {
    icon = scene.add.image(x, y, "yomari").setDisplaySize(size - 12, size - 12);
  } else if (badge === "jatra") {
    icon = scene.add.image(x, y, "menu-rath").setDisplaySize(size - 10, size - 10);
  } else {
    const character = getCharacterConfig(ProgressManager.getSelectedCharacter());
    icon = scene.add
      .sprite(x, y, character.textureKey, character.idleFrame)
      .setDisplaySize(size - 8, size - 8);
  }

  icon.setAlpha(alpha);
  container.add(icon);
  return icon;
}

export function showAchievementPopup(scene, achievement) {
  const { width } = scene.scale;
  const rowWidth = Math.min(width * 0.72, 620);
  const rowHeight = 72;
  const centerX = width / 2;
  const startY = -rowHeight;
  const targetY = 18;

  const container = scene.add.container(centerX, startY).setDepth(POPUP_DEPTH);

  const shadow = scene.add.rectangle(4, 4, rowWidth, rowHeight, colors.deepNum, 0.9);
  const body = scene.add.rectangle(0, 0, rowWidth, rowHeight, colors.darkNum, 1);
  const inner = scene.add.rectangle(0, 0, rowWidth - 6, rowHeight - 6, colors.panelNum, 0.35);
  container.add([shadow, body, inner]);

  const iconX = -rowWidth / 2 + 44;
  addBadgeIcon(scene, container, iconX, 0, 52, achievement.badge);

  const textX = iconX + 52;
  const title = scene.add
    .text(textX, -10, achievement.title, {
      fontFamily: "EarlyGameBoy",
      fontSize: "16px",
      color: colors.light,
    })
    .setOrigin(0, 0.5);

  const description = scene.add
    .text(textX, 14, achievement.description, {
      fontFamily: "EarlyGameBoy",
      fontSize: "13px",
      color: colors.accent,
      wordWrap: { width: rowWidth - 130 },
    })
    .setOrigin(0, 0.5);

  container.add([title, description]);

  scene.tweens.add({
    targets: container,
    y: targetY,
    duration: 420,
    ease: "Back.easeOut",
  });

  scene.time.delayedCall(3400, () => {
    scene.tweens.add({
      targets: container,
      y: startY,
      alpha: 0,
      duration: 320,
      ease: "Cubic.easeIn",
      onComplete: () => container.destroy(),
    });
  });
}

export function createAchievementBadge(scene, x, y, size, badge, { unlocked = true } = {}) {
  const container = scene.add.container(x, y);
  const alpha = unlocked ? 1 : 0.45;
  addBadgeIcon(scene, container, 0, 0, size, badge, alpha);
  if (!unlocked) {
    const lockOverlay = scene.add.rectangle(0, 0, size, size, colors.deepNum, 0.35);
    container.add(lockOverlay);
  }
  return container;
}
