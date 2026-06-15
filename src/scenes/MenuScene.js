import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.starting = false;

    const level1StartZone = this.add
      .zone(cx, cy, this.scale.width, this.scale.height)
      .setOrigin(0.5)
      .setDepth(-10)
      .setInteractive({ useHandCursor: true });

    level1StartZone.on("pointerdown", () => {
      this._startLevel("Level1Scene", 1);
    });

    const textConfig = {
      fontFamily: "EarlyGameBoy",
      fontSize: "45px",
      align: "center",
      stroke: "#152729",
      strokeThickness: 12,
      letterSpacing: 0,
    };

    // Lakhey image above title
    this.add
      .image(cx, cy - 200, "lakhey")
      .setOrigin(0.5)
      .setScale(0.6);

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

    const level2Button = this.add
      .text(cx, cy + 230, "LEVEL 2", {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: "#f1e8b6",
        backgroundColor: "#517f30",
        padding: { x: 18, y: 10 },
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    level2Button.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) event.stopPropagation();
      this._startLevel("Level2Scene", 2);
    });

    level2Button.on("pointerover", () => {
      level2Button.setScale(1.08);
    });

    level2Button.on("pointerout", () => {
      level2Button.setScale(1);
    });
  }

  _startLevel(sceneKey, level) {
    if (this.starting) return;

    this.starting = true;
    this.scene.stop("UIScene");
    this.scene.start(sceneKey);
    this.scene.launch("UIScene", { level });
  }
}
