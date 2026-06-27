export default class MazeCollectible {
  constructor(scene, { r, c, id }) {
    this.scene = scene;
    this.cell = { r, c };
    this.id = id;
    this.collected = false;

    this._createSprite();
    this.scene.sound.play("collect-yomari");
  }

  _createSprite() {
    const CELL_SIZE = this.scene.CELL_SIZE;
    const offsetX = this.scene.offsetX;
    const offsetY = this.scene.offsetY;

    // Center of the maze cell
    const x = offsetX + this.cell.c * CELL_SIZE + CELL_SIZE / 2;
    const y = offsetY + this.cell.r * CELL_SIZE + CELL_SIZE / 2;

    // Create sprite from loaded PNG
    this.sprite = this.scene.add.image(x, y, "yomari");

    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(15);

    // Resize to fit the maze cell
    this.sprite.setDisplaySize(
      CELL_SIZE * 0.8,
      CELL_SIZE * 0.8
    );

    // Floating animation
    this.scene.tweens.add({
      targets: this.sprite,
      y: y - 2,
      duration: 700,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  matchesCell(r, c) {
    return this.cell.r === r && this.cell.c === c;
  }

  collect() {
    if (this.collected) return false;

    this.collected = true;

    this.scene.sound.play("collect-yomari");

    this.sprite.setVisible(false);

    return true;
 }

  reset() {
    if (!this.sprite || !this.sprite.scene) {
      this._createSprite();
    }

    this.collected = false;

    this.sprite.setVisible(true);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    this.sprite.setAngle(0);
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  collect() {
    if (this.collected) return false;

    this.collected = true;

    this.scene.sound.play("collect-yomari");

    this.scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 8,
        scale: 1.2,
        alpha: 0,
        duration: 220,
        ease: "Back.easeIn",
        onComplete: () => this.sprite.destroy()
    });

    return true;
}
}