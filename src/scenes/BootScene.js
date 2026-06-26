import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load images (use rath.png for the menu icon instead of lakhey)
    this.load.image("lakhey", new URL("../assets/img/rathbrown.png", import.meta.url).href);

    // Load player atlas (Maicha)
    this.load.atlas(
      "player-girl",
      new URL("../assets/img/1.png", import.meta.url).href,
      new URL("../assets/img/1.json", import.meta.url).href
    );

    // Load Baucha spritesheet
    this.load.spritesheet("player-boy", new URL("../assets/img/bauchasprite.png", import.meta.url).href, {
      frameWidth: 181,
      frameHeight: 250,
    });

    console.log("BootScene: preloading assets...");
  }

  async create() {
    try {
      // Ensure the EarlyGameBoy font is loaded before creating text in MenuScene
      if (document && document.fonts) {
        await document.fonts.load('16px "EarlyGameBoy"');
        await document.fonts.ready;
      }
    } catch (e) {
      console.warn("Font load wait failed:", e);
    }
    this.scene.start("MenuScene");
  }
}
