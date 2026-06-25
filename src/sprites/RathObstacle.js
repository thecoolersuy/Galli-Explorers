const RATH_TEXTURE_KEY = "rath-obstacle";

export default class RathObstacle {
  constructor(scene, { route, phase = 0, moveMs = 380 }) {
    this.scene = scene;
    this.route = route;
    this.phase = phase;
    this.moveMs = moveMs;
    this.currentIndex = 0;
    this.currentCell = route[0];

    this._ensureTexture();

    this.sprite = this.scene.add.image(0, 0, RATH_TEXTURE_KEY);
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(45);
    this.update(0);
  }

  update(time) {
    if (!this.route.length) return;

    const step = Math.floor(time / this.moveMs + this.phase) % this.route.length;
    this.currentIndex = step;
    this.currentCell = this.route[step];

    const { x, y } = this.scene._cellCenter(
      this.currentCell.r,
      this.currentCell.c,
    );
    this.sprite.setPosition(x, y);
  }

  occupiesCell(r, c) {
    return this.currentCell.r === r && this.currentCell.c === c;
  }

  _ensureTexture() {
    if (this.scene.textures.exists(RATH_TEXTURE_KEY)) return;

    const S = this.scene.CELL_SIZE;
    const targetWidth = Math.max(1, Math.round(S * 1.5 * 1.2));
    const targetHeight = Math.max(1, Math.round(S * 1.8));
    const sourceTexture = this.scene.textures.get("rath");
    const source = sourceTexture.getSourceImage();
    const renderTexture = this.scene.textures.createCanvas(
      RATH_TEXTURE_KEY,
      targetWidth,
      targetHeight,
    );
    const ctx = renderTexture.context;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    renderTexture.refresh();
  }
}
