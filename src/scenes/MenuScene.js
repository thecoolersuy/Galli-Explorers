import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add
      .text(cx, cy - 70, "GALLI\nEXPLORER", {
        fontFamily: "EarlyGameBoy",
        fontSize: "49px",
        color: "#acb64b",
        align: "center",
        // backgroundColor: "#152729"
        stroke: "#000000",
        strokeThickness: 16,
      })
      .setOrigin(0.5);

    // OBJECTIVE
    this.add
      .text(
        cx,
        cy + 55,
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
        cy + 122,
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
      .text(cx, cy + 200, "CLICK ANYWHERE TO START", {
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
