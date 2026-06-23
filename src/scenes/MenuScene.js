import Phaser from "phaser";
import colors from "../styles/colors.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const textConfig = {
      fontFamily: "EarlyGameBoy",
      fontSize: "45px",
      align: "center",
      stroke: colors.dark,
      strokeThickness: 12,
      letterSpacing: 0,
    };

    // Lakhey image above title
    this.add
      .image(cx, cy - 180, "lakhey")
      .setOrigin(0.5)
      .setScale(0.6);

    // Shadow layer — offset behind, dark color
    this.add
      .text(cx + 4, cy - 100 + 80, "GALLI\nEXPLORER", {
        ...textConfig,
        color: colors.dark,
      })
      .setOrigin(0.5);

    // Main text on top
    this.add
      .text(cx, cy - 28, "GALLI\nEXPLORER", {
        ...textConfig,
        color: colors.accent,
      })
      .setOrigin(0.5);

    // OBJECTIVE
    this.add
      .text(
        cx,
        cy + 85,
        "NAVIGATE THROUGH BHAKTAPUR'S CHAOTIC NARROW GALLIS\nAND HELP BAUCHA REACH HOME SAFELY.",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "17px",
          color: colors.textDark,
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    // CONTROLS
    this.add
      .text(
        cx,
        cy + 155,
        "USE ARROW KEYS OR A / D TO MOVE.\n ON PHONES: USE THE CORNER BUTTONS",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "15px",
          color: colors.controls,
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    const playButton = this.add.rectangle(
      cx + 6,
      cy + 232,
      210,
      58,
      colors.deepNum,
    );
    const playBody = this.add.rectangle(cx, cy + 226, 210, 58, colors.darkNum);
    const playInner = this.add.rectangle(cx, cy + 226, 202, 50, colors.deepNum);
    const playText = this.add
      .text(cx, cy + 226, "PLAY >>> ", {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: colors.light,
        align: "center",
      })
      .setOrigin(0.5);

    playBody.setInteractive({ useHandCursor: true });
    playBody.on("pointerdown", () => {
      this.scene.start("LevelIntroScene", { level: 1 });
    });
    playBody.on("pointerover", () => playBody.setScale(1.04));
    playBody.on("pointerout", () => playBody.setScale(1));

    playButton.setDepth(1);
    playBody.setDepth(2);
    playInner.setDepth(3);
    playText.setDepth(4);

    this.input.keyboard?.once("keydown-ENTER", () => {
      this.scene.start("LevelIntroScene", { level: 1 });
    });
  }
}
