import Phaser from "phaser";
import colors from "../styles/colors.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create(data) {
    const levelNum = data && data.level ? data.level : 1;
    // HUD — timer, lives, score (we'll build this out in Step 4)
    this.add.text(16, 16, `Level ${levelNum}`, {
      fontFamily: "EarlyGameBoy",
      fontSize: "26px",
      color: colors.textDark,
    });
  }
}
