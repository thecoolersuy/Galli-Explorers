import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("menu-rath", new URL("../assets/img/rathbrown.png", import.meta.url).href);

    // Load player atlas (Maicha)
    this.load.atlas(
      "player-girl",
      new URL("../assets/img/1.png", import.meta.url).href,
      new URL("../assets/img/1.json", import.meta.url).href
    );

    // Load yomari

    this.load.image(
    "yomari",
    new URL("../assets/img/yomari.png", import.meta.url).href
    );

    this.load.audio(
     "collect-yomari",
      new URL("../assets/audio/yomaricollect.mp3", import.meta.url).href
    );
    this.load.audio(
      "intro-sound",
      new URL("../assets/audio/introsound.mp3", import.meta.url).href
    );

    // Baucha sheet has 9 columns; keep the whole source height so the lower body is not clipped.
    this.load.spritesheet("player-boy", new URL("../assets/img/bauchasprite.png", import.meta.url).href, {
      frameWidth: 230,
      frameHeight: 724,
      endFrame: 8,
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
