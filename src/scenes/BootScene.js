import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // We'll load assets here later
    console.log('BootScene: preloading assets...');
  }

  async create() {
    try {
      // Ensure the EarlyGameBoy font is loaded before creating text in MenuScene
      if (document && document.fonts) {
        await document.fonts.load('16px "EarlyGameBoy"');
        await document.fonts.ready;
      }
    } catch (e) {
      console.warn('Font load wait failed:', e);
    }
    this.scene.start('MenuScene');
  }
}