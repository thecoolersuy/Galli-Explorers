import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load images (use rath.png for the menu icon instead of lakhey)
    this.load.image("lakhey", "src/assets/img/rathbrown.png");

    // Load player sheet as image; frames are sliced manually in each level scene
    this.load.image("player-girl-sheet", new URL("../assets/img/1.png", import.meta.url).href);

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
