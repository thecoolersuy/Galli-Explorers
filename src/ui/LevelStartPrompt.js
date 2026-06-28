import Phaser from "phaser";
import colors from "../styles/colors.js";

const PROMPT_DEPTH = 200;

export function showLevelStartPrompt(scene, onStart) {
  const { width, height } = scene.scale;
  const centerX = width / 2;
  const centerY = height / 2;

  const container = scene.add.container(0, 0).setDepth(PROMPT_DEPTH);

  const backdrop = scene.add.rectangle(
    centerX,
    height / 2,
    width,
    height,
    colors.bgNum,
    0.55,
  );
  container.add(backdrop);

  const buttonWidth = 210;
  const buttonHeight = 58;
  const buttonY = centerY + 40;

  const shadow = scene.add.rectangle(
    centerX + 6,
    buttonY + 6,
    buttonWidth,
    buttonHeight,
    colors.deepNum,
  );
  const body = scene.add.rectangle(
    centerX,
    buttonY,
    buttonWidth,
    buttonHeight,
    colors.darkNum,
  );
  const inner = scene.add.rectangle(
    centerX,
    buttonY,
    buttonWidth - 8,
    buttonHeight - 8,
    colors.deepNum,
  );
  const label = scene.add
    .text(centerX, buttonY, "START >>>", {
      fontFamily: "EarlyGameBoy",
      fontSize: "18px",
      color: colors.light,
      align: "center",
    })
    .setOrigin(0.5);

  container.add([shadow, body, inner, label]);

  let started = false;

  const begin = () => {
    if (started) return;
    started = true;

    container.destroy();
    scene.input.keyboard?.off("keydown-ENTER", begin);
    onStart();
  };

  body.setInteractive({ useHandCursor: true });
  body.on("pointerdown", begin);
  body.on("pointerover", () => body.setScale(1.04));
  body.on("pointerout", () => body.setScale(1));
  scene.input.keyboard?.once("keydown-ENTER", begin);

  return container;
}
