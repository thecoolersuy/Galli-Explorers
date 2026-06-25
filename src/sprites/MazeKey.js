const KEY_TEXTURE = "maze-gold-key";

export default class MazeKey {
  constructor(scene, { r, c, id = "key" }) {
    this.scene = scene;
    this.id = id;
    this.cell = { r, c };
    this.collected = false;

    this._ensureTexture();

    const { x, y } = this.scene._cellCenter(r, c);
    this.sprite = this.scene.add.image(x, y, KEY_TEXTURE);
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(35);
    this.sprite.setDisplaySize(
      Math.round(this.scene.CELL_SIZE * 0.78),
      Math.round(this.scene.CELL_SIZE * 0.78),
    );
  }

  matchesCell(r, c) {
    return !this.collected && this.cell.r === r && this.cell.c === c;
  }

  collect() {
    if (this.collected) return false;

    this.collected = true;
    this.sprite.destroy();

    return true;
  }

  _ensureTexture() {
    if (this.scene.textures.exists(KEY_TEXTURE)) return;

    const size = 64;
    const texture = this.scene.textures.createCanvas(KEY_TEXTURE, size, size);
    const ctx = texture.context;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#2b1708";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(22, 28, 10, 0, Math.PI * 2);
    ctx.moveTo(32, 28);
    ctx.lineTo(52, 28);
    ctx.lineTo(52, 38);
    ctx.moveTo(43, 28);
    ctx.lineTo(43, 36);
    ctx.stroke();

    ctx.strokeStyle = "#f1c45b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(22, 28, 10, 0, Math.PI * 2);
    ctx.moveTo(32, 28);
    ctx.lineTo(52, 28);
    ctx.lineTo(52, 38);
    ctx.moveTo(43, 28);
    ctx.lineTo(43, 36);
    ctx.stroke();

    ctx.fillStyle = "#f7efe3";
    ctx.beginPath();
    ctx.arc(22, 28, 4, 0, Math.PI * 2);
    ctx.fill();

    texture.refresh();
  }
}
