import { Cell } from './Cell.js';

/**
 * Represents a coordinate on the infinite 2D grid.
 * Coordinates are immutable and can be used as map keys.
 */
export class Coordinate {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Create a string key for efficient map usage
    this._key = `${x},${y}`;
  }

  /**
   * Get the string representation for use as Map keys
   * @returns {string}
   */
  get key() {
    return this._key;
  }

  /**
   * Check if this coordinate equals another
   * @param {Coordinate} other
   * @returns {boolean}
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Get all orthogonally adjacent coordinates
   * @returns {Coordinate[]}
   */
  getOrthogonalAdjacent() {
    return [
      new Coordinate(this.x, this.y + 1), // North
      new Coordinate(this.x + 1, this.y), // East
      new Coordinate(this.x, this.y - 1), // South
      new Coordinate(this.x - 1, this.y)  // West
    ];
  }

  /**
   * Get all diagonally adjacent coordinates
   * @returns {Coordinate[]}
   */
  getDiagonalAdjacent() {
    return [
      new Coordinate(this.x + 1, this.y + 1), // NE
      new Coordinate(this.x + 1, this.y - 1), // SE
      new Coordinate(this.x - 1, this.y - 1), // SW
      new Coordinate(this.x - 1, this.y + 1)  // NW
    ];
  }

  /**
   * Get all adjacent coordinates (orthogonal + diagonal)
   * @returns {Coordinate[]}
   */
  getAllAdjacent() {
    return [...this.getOrthogonalAdjacent(), ...this.getDiagonalAdjacent()];
  }

  /**
   * Check if this coordinate is orthogonally adjacent to another
   * @param {Coordinate} other
   * @returns {boolean}
   */
  isOrthogonallyAdjacentTo(other) {
    const dx = Math.abs(this.x - other.x);
    const dy = Math.abs(this.y - other.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  /**
   * Check if this coordinate is diagonally adjacent to another
   * @param {Coordinate} other
   * @returns {boolean}
   */
  isDiagonallyAdjacentTo(other) {
    const dx = Math.abs(this.x - other.x);
    const dy = Math.abs(this.y - other.y);
    return dx === 1 && dy === 1;
  }

  /**
   * Check if this coordinate is adjacent (orthogonal or diagonal) to another
   * @param {Coordinate|Cell} other
   * @param {Object} [options]
   * @param {boolean} [options.allowOrthogonal] - Whether to allow orthogonal adjacency
   * @param {boolean} [options.allowDiagonal] - Whether to allow diagonal adjacency
   * @returns {boolean}
   */
  isAdjacentTo(other, options = { allowOrthogonal: true, allowDiagonal: true }) {
    const { allowOrthogonal = true, allowDiagonal = true } = options;
    if (other instanceof Cell) {
      other = other.coordinate;
    }
    return (allowOrthogonal && this.isOrthogonallyAdjacentTo(other)) ||
           (allowDiagonal && this.isDiagonallyAdjacentTo(other));
  }

  /**
   * Calculate Manhattan distance to another coordinate
   * @param {Coordinate} other
   * @returns {number}
   */
  manhattanDistanceTo(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }

  /**
   * Check if this coordinate is in the same line (orthogonal) as another
   * @param {Coordinate|Cell} other
   * @param {Object} options
   * @returns {boolean}
   */
  isOrthogonalTo(other, options = {}) {
    if (other instanceof Cell) {
      other = other.coordinate;
    }
    const onSameRow = this.y === other.y;
    const onSameCol = this.x === other.x;
    
    if (!onSameRow && !onSameCol) {
      return false;
    }

    return true;
  }

  /**
   * Get all coordinates in an orthogonal line to the target
   * @param {Coordinate} target
   * @returns {Coordinate[]} Path excluding start and end coordinates
   */
  getOrthogonalPathTo(target) {
    if (!this.isOrthogonalTo(target)) {
      return [];
    }

    const path = [];
    if (this.x === target.x) {
      // Vertical line
      const start = Math.min(this.y, target.y) + 1;
      const end = Math.max(this.y, target.y);
      for (let y = start; y < end; y++) {
        path.push(new Coordinate(this.x, y));
      }
    } else {
      // Horizontal line
      const start = Math.min(this.x, target.x) + 1;
      const end = Math.max(this.x, target.x);
      for (let x = start; x < end; x++) {
        path.push(new Coordinate(x, this.y));
      }
    }
    return path;
  }

  /**
   * String representation
   * @returns {string}
   */
  toString() {
    return `(${this.x}, ${this.y})`;
  }

  /**
   * Create a coordinate from a string key
   * @param {string} key - Format: "x,y"
   * @returns {Coordinate}
   */
  static fromKey(key) {
    const [x, y] = key.split(',').map(Number);
    return new Coordinate(x, y);
  }
}
