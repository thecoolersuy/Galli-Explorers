import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create(data = {}) {
    const level = data.level || 1;

    // HUD — timer, lives, score (we'll build this out in Step 4)
    this.add.text(16, 16, `Level ${level}`, {
      fontFamily: "EarlyGameBoy",
      fontSize: "26px",
      color: "#1b2e24",
    });
  }
}
