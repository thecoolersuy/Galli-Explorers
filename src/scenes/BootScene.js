import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load images
    this.load.image("lakhey", "src/assets/img/lakhey(final).png");

    // Load player spritesheet: 12 horizontal frames, each 230px wide x 430px tall
    this.load.spritesheet("player-girl", "src/assets/img/1.png", {
      frameWidth: 230,
      frameHeight: 430,
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
