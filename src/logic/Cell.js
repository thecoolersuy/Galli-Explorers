export default class Cell {
  constructor(i, j, nrows, ncols) {
    this.r = i;
    this.c = j;
    this.nrows = nrows;
    this.ncols = ncols;

    this.neighbors = [];
    this.walls = [true, true, true, true]; // Top Right Bottom Left
    this.visited = false;
  }

  createNeighbors(grid) {
    const { r, c, nrows, ncols } = this;
    if (r > 0) this.neighbors.push(grid[(r - 1) * ncols + c]); // Top
    if (c < ncols - 1) this.neighbors.push(grid[r * ncols + (c + 1)]); // Right
    if (r < nrows - 1) this.neighbors.push(grid[(r + 1) * ncols + c]); // Bottom
    if (c > 0) this.neighbors.push(grid[r * ncols + (c - 1)]); // Left
  }
}
