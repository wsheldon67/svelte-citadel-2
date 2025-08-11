import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * @typedef {Object} PieceOptions
 * @property {string} type - The type of piece (e.g., 'Bird', 'Soldier')
 * @property {string} owner - The player who owns this piece
 * @property {string} [id] - Unique identifier for the piece
 */

/**
 * @typedef {Object} PieceJSON
 * @property {string} type
 * @property {string} owner
 * @property {string} id
 */

/**
 * Base class for all pieces in the game.
 * Provides utilities and a flexible action system for piece authoring.
 */
export class Piece {
  /**
   * @param {PieceOptions} options
   */
  constructor({ type, owner, id = undefined }) {
    this.type = type;
    this.owner = owner;
    this.id = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Position is managed by the game state, not stored in the piece
    /** @type {Coordinate|null} */
    this._coordinate = null;
    
    // Reference to the current game state (set when piece is placed)
    /** @type {import('../engine/GameState.js').GameState|null} */
    this._gameState = null;
  }

  /**
   * Get the current coordinate of this piece
   * @returns {Coordinate|null}
   */
  get coordinate() {
    return this._coordinate;
  }

  /**
   * Set the coordinate (used internally by game engine)
   * @param {Coordinate|null} coord
   * @internal
   */
  _setCoordinate(coord) {
    this._coordinate = coord;
  }

  /**
   * Set the game state reference (used internally by game engine)
   * @param {import('../engine/GameState.js').GameState} gameState
   * @internal
   */
  _setGameState(gameState) {
    this._gameState = gameState;
  }

  /**
   * Check if this piece is orthogonally adjacent to a target coordinate
   * @param {Coordinate} target
   * @param {Object} [options]
   * @param {boolean} [options.gapsAllowed] - Whether gaps are allowed in the line
   * @returns {boolean}
   */
  isOrthogonalTo(target, options = {}) {
    if (!this.coordinate) {
      return false;
    }
    const opts = { gapsAllowed: true, ...options };
    return this.coordinate.isOrthogonalTo(target, opts);
  }

  /**
   * Check if this piece is adjacent to a target coordinate
   * @param {Coordinate} target
   * @returns {boolean}
   */
  isAdjacentTo(target) {
    if (!this.coordinate) {
      return false;
    }
    return this.coordinate.isAdjacentTo(target);
  }

  /**
   * Check if this piece is orthogonally adjacent to a target coordinate
   * @param {Coordinate} target
   * @returns {boolean}
   */
  isOrthogonallyAdjacentTo(target) {
    if (!this.coordinate) {
      return false;
    }
    return this.coordinate.isOrthogonallyAdjacentTo(target);
  }

  /**
   * Check if this piece is diagonally adjacent to a target coordinate
   * @param {Coordinate} target
   * @returns {boolean}
   */
  isDiagonallyAdjacentTo(target) {
    if (!this.coordinate) {
      return false;
    }
    return this.coordinate.isDiagonallyAdjacentTo(target);
  }

  /**
   * Get the Manhattan distance to a target coordinate
   * @param {Coordinate} target
   * @returns {number}
   */
  manhattanDistanceTo(target) {
    if (!this.coordinate) {
      return Infinity;
    }
    return this.coordinate.manhattanDistanceTo(target);
  }

  /**
   * Get all coordinates in an orthogonal line to the target
   * @param {Coordinate} target
   * @returns {Coordinate[]} Path excluding start and end coordinates
   */
  getOrthogonalPathTo(target) {
    if (!this.coordinate) {
      return [];
    }
    return this.coordinate.getOrthogonalPathTo(target);
  }

  /**
   * Check if the path to a target is clear (no pieces blocking)
   * @param {Coordinate} target
   * @returns {boolean}
   */
  isPathClear(target) {
    if (!this._gameState || !this.coordinate) {
      return false;
    }
    
    const path = this.getOrthogonalPathTo(target);
    return path.every(coord => !this._gameState?.hasPiece(coord));
  }

  /**
   * Get all valid action targets for this piece
   * This should be overridden by subclasses to implement piece-specific logic
   * @param {import('../engine/GameState.js').GameState} gameState
   * @returns {Coordinate[]}
   */
  getValidTargets(gameState) {
    // Base implementation returns empty array
    // Subclasses should override this method
    return [];
  }

  /**
   * Get all available actions for this piece
   * This should be overridden by subclasses to return their action classes
   * @returns {Function[]} Array of Action constructor functions
   */
  getActions() {
    // Base implementation returns empty array
    // Subclasses should override this method to return their actions
    return [];
  }

  /**
   * Create a deep copy of this piece
   * @returns {Piece}
   */
  copy() {
    // Use the constructor function from the prototype
    const Constructor = /** @type {typeof Piece} */ (this.constructor);
    const copy = new Constructor({
      type: this.type,
      owner: this.owner,
      id: this.id
    });
    return copy;
  }

  /**
   * Serialize the piece to JSON
   * @returns {PieceJSON}
   */
  toJSON() {
    return {
      type: this.type,
      owner: this.owner,
      id: this.id
    };
  }

  /**
   * Create a piece from JSON data
   * @param {PieceJSON} data
   * @returns {Piece}
   */
  static fromJSON(data) {
    return new Piece({
      type: data.type,
      owner: data.owner,
      id: data.id
    });
  }

  isTerrain() {
    // Default implementation - can be overridden by terrain pieces
    return false;
  }
}
