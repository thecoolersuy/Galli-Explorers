export default class MazeGenerator {
  constructor(grid, ncols) {
    this.grid = grid;
    this.ncols = ncols;
    this.stack = [];
    this.current = grid[0];
    this.done = false;
  }

  step() {
    if (this.done) return;

    const current = this.current;

    if (!current.visited) {
      current.visited = true;
      this.stack.push(current);
    }

    const unvisited = current.neighbors.filter(n => !n.visited);

    if (unvisited.length > 0) {
      const next = unvisited[Math.floor(Math.random() * unvisited.length)];
      this._removeWalls(current, next);
      this.current = next;
    } else if (this.stack.length > 0) {
      this.current = this.stack.pop();
    } else {
      this.done = true;
    }
  }

  _removeWalls(a, b) {
    const dr = a.r - b.r;
    const dc = a.c - b.c;

    if (dr === 1)  { a.walls[0] = false; b.walls[2] = false; } // a below b
    if (dr === -1) { a.walls[2] = false; b.walls[0] = false; } // a above b
    if (dc === 1)  { a.walls[3] = false; b.walls[1] = false; } // a right of b
    if (dc === -1) { a.walls[1] = false; b.walls[3] = false; } // a left of b
  }

  // Run to completion instantly (no animation)
  generate() {
    while (!this.done) this.step();
  }
}