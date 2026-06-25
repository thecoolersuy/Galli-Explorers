import Phaser from "phaser";
import colors from "../styles/colors.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create(data) {
    const levelNum = data && data.level ? data.level : 1;
    const totalKeys = data && data.totalKeys ? data.totalKeys : 0;

    this.add.text(16, 16, `Level ${levelNum}`, {
      fontFamily: "EarlyGameBoy",
      fontSize: "26px",
      color: colors.textDark,
    });

    if (totalKeys > 0) {
      this.keyText = this.add.text(16, 52, `Keys: 0/${totalKeys}`, {
        fontFamily: "EarlyGameBoy",
        fontSize: "20px",
        color: colors.textDark,
      });

      this.events.on("keysChanged", (collectedKeys, nextTotalKeys) => {
        this.keyText.setText(`Keys: ${collectedKeys}/${nextTotalKeys}`);
      });
    }
  }
}
