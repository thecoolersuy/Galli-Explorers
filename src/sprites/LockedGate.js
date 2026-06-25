import colors from "../styles/colors.js";

export default class LockedGate {
  constructor(scene, edge) {
    this.scene = scene;
    this.edge = {
      a: { ...edge.a },
      b: { ...edge.b },
    };
    this.locked = true;
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(42);
    this._draw();
  }

  blocksMove(fromCell, toCell) {
    if (!this.locked) return false;

    return this.scene._edgeMatches(this.edge, fromCell, toCell);
  }

  open() {
    if (!this.locked) return;

    this.locked = false;
    this.graphics.clear();
  }

  _draw() {
    const S = this.scene.CELL_SIZE;
    const { a, b } = this.edge;
    const ax = this.scene.offsetX + a.c * S;
    const ay = this.scene.offsetY + a.r * S;
    const bx = this.scene.offsetX + b.c * S;
    const by = this.scene.offsetY + b.r * S;
    const thickness = 14;

    this.graphics.clear();
    this.graphics.fillStyle(colors.deepNum, 1);
    this.graphics.lineStyle(3, colors.lightNum, 1);

    if (a.r === b.r) {
      const x = Math.max(ax, bx);
      const y = ay + S * 0.12;
      this.graphics.fillRect(x - thickness / 2, y, thickness, S * 0.76);
      this.graphics.strokeRect(x - thickness / 2, y, thickness, S * 0.76);
      this._drawBars(x, y, thickness, S * 0.76, true);
    } else {
      const x = ax + S * 0.12;
      const y = Math.max(ay, by);
      this.graphics.fillRect(x, y - thickness / 2, S * 0.76, thickness);
      this.graphics.strokeRect(x, y - thickness / 2, S * 0.76, thickness);
      this._drawBars(x, y, S * 0.76, thickness, false);
    }
  }

  _drawBars(x, y, width, height, verticalGate) {
    this.graphics.lineStyle(2, colors.accentNum, 1);

    if (verticalGate) {
      for (let offset = 0.25; offset <= 0.75; offset += 0.25) {
        const barY = y + height * offset;
        this.graphics.beginPath();
        this.graphics.moveTo(x - width / 2 + 2, barY);
        this.graphics.lineTo(x + width / 2 - 2, barY);
        this.graphics.strokePath();
      }
      return;
    }

    for (let offset = 0.25; offset <= 0.75; offset += 0.25) {
      const barX = x + width * offset;
      this.graphics.beginPath();
      this.graphics.moveTo(barX, y - height / 2 + 2);
      this.graphics.lineTo(barX, y + height / 2 - 2);
      this.graphics.strokePath();
    }
  }
}
