import Phaser from "phaser";

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
      stroke: "#152729",
      strokeThickness: 12,
      letterSpacing: 0,
    };

    // Shadow layer — offset behind, dark color
    this.add
      .text(cx + 4, cy - 100 + 10, "GALLI\nEXPLORER", {
        ...textConfig,
        color: "#152729",
      })
      .setOrigin(0.5);

    // Main text on top
    this.add
      .text(cx, cy - 100, "GALLI\nEXPLORER", {
        ...textConfig,
        color: "#acb64b",
      })
      .setOrigin(0.5);

    // OBJECTIVE
    this.add
      .text(
        cx,
        cy + 30,
        "NAVIGATE THROUGH BHAKTAPUR'S CHAOTIC NARROW GALLIS\nAND HELP BAUCHA REACH HOME SAFELY.",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "17px",
          color: "#1b2e24",
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    // CONTROLS
    this.add
      .text(
        cx,
        cy + 100,
        "USE ARROW KEYS OR A / D TO MOVE.\n ON PHONES: USE THE CORNER BUTTONS",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "15px",
          color: "#517f30",
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    // START TEXT
    const startText = this.add
      .text(cx, cy + 175, "CLICK ANYWHERE TO START", {
        fontFamily: "EarlyGameBoy",
        fontSize: "16px",
        color: "#517f30",
        align: "center",
      })
      .setOrigin(0.5);
    // Blinking animation
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Level1Scene");
      this.scene.launch("UIScene");
    });
  }
}
