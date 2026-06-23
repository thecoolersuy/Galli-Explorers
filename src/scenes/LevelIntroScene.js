import Phaser from "phaser";
import colors from "../styles/colors.js";

const LEVEL_INTROS = {
  1: {
    title: "LEVEL 1",
    subtitle: "THE GALLI RUN",
    description:
      "Guide Baucha through the narrow gallis and reach home safely before the crowd closes in.",
    nextScene: "Level1Scene",
  },
  2: {
    title: "LEVEL 2",
    subtitle: "THE PROCESSION",
    description:
      "Capture the sea of people drenched in vermillion, where deities drift in palanquins beneath colorful parasols, and the air hums with dhime and bhusya echoing through Balkumari, Siddhi Kali, Bishnubir and Layaku.",
    nextScene: "Level2Scene",
  },
};

export default class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super("LevelIntroScene");
  }

  create(data = {}) {
    const levelNum = data.level === 2 ? 2 : 1;
    const intro = LEVEL_INTROS[levelNum];

    this.scene.stop("UIScene");

    this.cameras.main.setBackgroundColor(colors.bgNum);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const panelWidth = Math.min(this.scale.width * 0.84, 980);
    const panelHeight = Math.min(this.scale.height * 0.68, 520);
    const panelLeft = centerX - panelWidth / 2;
    const panelTop = centerY - panelHeight / 2;

    this.add.rectangle(
      centerX + 14,
      centerY + 14,
      panelWidth,
      panelHeight,
      colors.deepNum,
    );
    this.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      colors.panelNum,
    );
    this.add
      .rectangle(
        centerX,
        centerY,
        panelWidth - 18,
        panelHeight - 18,
        colors.accentNum,
      )
      .setAlpha(0.12);

    const frame = this.add.graphics();
    frame.lineStyle(8, colors.darkNum, 1);
    frame.strokeRect(panelLeft, panelTop, panelWidth, panelHeight);
    frame.lineStyle(3, colors.controlsNum, 1);
    frame.strokeRect(
      panelLeft + 12,
      panelTop + 12,
      panelWidth - 24,
      panelHeight - 24,
    );

    this.add
      .text(centerX, panelTop + 48, intro.title, {
        fontFamily: "EarlyGameBoy",
        fontSize: "34px",
        color: colors.light,
        stroke: colors.dark,
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, panelTop + 96, intro.subtitle, {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: colors.accent,
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 18, intro.description, {
        fontFamily: "EarlyGameBoy",
        fontSize: "17px",
        color: colors.bg,
        align: "center",
        wordWrap: { width: panelWidth - 160 },
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    this._createButton({
      x: centerX - 120,
      y: panelTop + panelHeight - 74,
      width: 180,
      height: 54,
      label: "PLAY >>>",
      onClick: () => {
        this.scene.start(intro.nextScene);
        this.scene.launch("UIScene", { level: levelNum });
      },
    });

    this._createButton({
      x: centerX + 120,
      y: panelTop + panelHeight - 74,
      width: 180,
      height: 54,
      label: "BACK",
      onClick: () => {
        this.scene.start("MenuScene");
      },
    });
  }

  _createButton({ x, y, width, height, label, onClick }) {
    const shadow = this.add.rectangle(
      x + 6,
      y + 6,
      width,
      height,
      colors.deepNum,
    );
    const body = this.add.rectangle(x, y, width, height, colors.darkNum);
    const inner = this.add.rectangle(
      x,
      y,
      width - 8,
      height - 8,
      colors.deepNum,
    );
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: "EarlyGameBoy",
        fontSize: "16px",
        color: colors.light,
        align: "center",
      })
      .setOrigin(0.5);

    body.setInteractive({ useHandCursor: true });
    body.on("pointerdown", onClick);
    body.on("pointerover", () => body.setScale(1.04));
    body.on("pointerout", () => body.setScale(1));

    shadow.setDepth(1);
    body.setDepth(2);
    inner.setDepth(3);
    labelText.setDepth(4);
  }
}
