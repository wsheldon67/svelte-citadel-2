import { GameError, RuleViolation } from '../engine/Errors.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * @typedef {Object} PieceOptions
 * @property {string} type - The type of piece (e.g., 'Bird', 'Soldier')
 * @property {string} owner - The player who owns this piece
 * @property {string} [id] - Unique identifier for the piece
 * @property {import('../engine/GameState.js').GameState} [gameState] - Optional game state reference
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
  constructor({ type, owner, id = undefined, gameState = undefined }) {
    this.type = type;
    this.owner = owner;
    this.id = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Position is managed by the game state, not stored in the piece
    /** @type {Coordinate|null} */
    this._coordinate = null;
    
    // Reference to the current game state (set when piece is placed or provided in constructor)
    /** @type {import('../engine/GameState.js').GameState|null} */
    this._gameState = gameState || null;
  }

  /**
   * Get the current coordinate of this piece
   * @returns {Coordinate|null}
   */
  get coordinate() {
    return this._coordinate;
  }

  /**
   * Get the current game state reference
   * @returns {import('../engine/GameState.js').GameState|null}
   */
  get gameState() {
    return this._gameState;
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
   * Check if this piece is orthogonal to a target coordinate
   * @param {Coordinate|import('../engine/Cell.js').Cell} target
   * @param {Object} [options]
   * @param {boolean} [options.gapsAllowed] - Whether terrain gaps (water) are allowed in the line
   * @param {boolean} [options.blockersAllowed] - Whether other pieces (blockers) are allowed in the line
   * @returns {boolean}
   */
  isOrthogonalTo(target, options = { gapsAllowed: false, blockersAllowed: false }) {
    if (!this.coordinate) {
      return false;
    }
    
    // Get the target coordinate
    const targetCoord = target instanceof Coordinate ? target : target.coordinate;
    
    // First check if the coordinates are orthogonal (same row or column)
    if (!this.coordinate.isOrthogonalTo(targetCoord)) {
      return false;
    }
    
    // If gaps/blockers are allowed, we don't need to check for terrain
    if (options.gapsAllowed && options.blockersAllowed) {
      return true;
    }
    
    // If gaps are not allowed, check that all coordinates in the path have terrain
    if (!this._gameState) {
      // Without game state, we can't check for terrain gaps
      throw new GameError(`Cannot check for blockers/terrain gaps when game state is not provided to Piece.`);
    }
    
    // Get the path between the coordinates (excluding start and end)
    const path = this.coordinate.getOrthogonalPathTo(targetCoord);
    
    // Check that every coordinate in the path has terrain (not water)
    for (const coord of path) {
      const cell = this._gameState.getCell(coord);
      if (!options.gapsAllowed && (!cell || !cell.hasTerrain())) {
        return false; // Water blocks the path
      }
      if (!options.blockersAllowed && cell.hasPiece()) {
        return false; // Pieces block the path
      }
    }
    
    return true;
  }

  /**
   * Check if this coordinate is adjacent (orthogonal or diagonal) to another
   * @param {Coordinate|import('../engine/Cell.js').Cell} target
   * @param {Object} [options]
   * @param {boolean} [options.allowOrthogonal] - Whether to allow orthogonal adjacency
   * @param {boolean} [options.allowDiagonal] - Whether to allow diagonal adjacency
   * @returns {boolean}
   */
  isAdjacentTo(target, options = { allowOrthogonal: true, allowDiagonal: true }) {
    if (!this.coordinate) {
      return false;
    }
    return this.coordinate.isAdjacentTo(target, options);
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
      id: this.id,
      gameState: this._gameState || undefined
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
   * Default implementation that works for most pieces.
   * Subclasses can override if they need special deserialization logic.
   * @param {PieceJSON} data
   * @param {import('../engine/GameState.js').GameState} [gameState] - Optional game state reference
   * @returns {Piece}
   */
  static fromJSON(data, gameState = undefined) {
    // @ts-ignore - Subclasses handle the type parameter in their constructors
    return new this({
      owner: data.owner,
      id: data.id,
      gameState: gameState
    });
  }

  isTerrain() {
    // Default implementation - can be overridden by terrain pieces
    return false;
  }
}
