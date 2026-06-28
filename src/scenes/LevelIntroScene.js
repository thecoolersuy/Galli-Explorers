import Phaser from "phaser";
import colors from "../styles/colors.js";

const LEVEL_INTROS = {
  1: {
    title: "LEVEL 1",
    subtitle: "JATRA AYOOO",
    description:
      "Guide Baucha through the narrow gallis and reach home safely before the crowd closes in.",
    nextScene: "Level1Scene",
  },
  2: {
    title: "LEVEL 2",
    subtitle: "LOADSHEDDING VAYO FERI",
    description:
      "The streetlamps flicker and buzz. You just stepped into the quiet, winding alleyways of Thimi. Loadshedding has struck. Pitch darkness. \n \n You must now guide Maicha through the narrow and confusing gallis. Use only the faint glow of her diyo (oil lamp) to navigate twists and turns without bumping into crowded jatras.",
    nextScene: "Level2Scene",
  },
  3: {
    title: "LEVEL 3",
    subtitle: "LAKHEY MAZE CHASE",
    description:
      "A fierce Lakhey mask roams the gallis. Watch its path, keep your distance, and reach ghar without letting it touch you.",
    nextScene: "Level3Scene",
  },
  4: {
    title: "LEVEL 4",
    subtitle: "LOCKED GATE",
    description:
      "The way home is blocked. Find the hidden key, return to the locked gate, and open the path to ghar.",
    nextScene: "Level4Scene",
  },
  5: {
    title: "LEVEL 5",
    subtitle: "THREE KEYS",
    description:
      "One gate needs three keys. Explore the maze, collect every key, and unlock the final route home.",
    nextScene: "Level5Scene",
    totalKeys: 3,
  },
};

export default class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super("LevelIntroScene");
  }

  create(data = {}) {
    const levelNum = LEVEL_INTROS[data.level] ? data.level : 1;
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
      label: "PLAY",
      onClick: () => {
        this.scene.start(intro.nextScene);
        this.scene.launch("UIScene", {
          level: levelNum,
          totalKeys: intro.totalKeys || 0,
          totalCollectibles: 3,
        });
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
    const bg = this.add.rectangle(x, y, width, height, colors.accentNum);
    
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: "EarlyGameBoy",
        fontSize: "16px",
        color: colors.dark,
        align: "center",
      })
      .setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
    bg.on("pointerover", () => {
      bg.setFillStyle(colors.darkNum);
      labelText.setColor(colors.accent);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(colors.accentNum);
      labelText.setColor(colors.dark);
    });

    bg.setDepth(2);
    labelText.setDepth(4);
  }
}
