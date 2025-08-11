import { Piece } from './Piece.js';
import { Place } from '../actions/Place.js';
import { Coordinate } from '../engine/Coordinate.js';
import { RuleViolation } from '../engine/RuleViolation.js';

/**
 * Land piece implementation
 * 
 * Land represents terrain tiles that other pieces can be placed on.
 * - Only 1 Land per coordinate
 * - Pieces are typically placed on top of Land
 * - Land is placed in Water (empty spaces)
 * - Land must be placed adjacent to existing terrain
 */
export class Land extends Piece {
  /**
   * @param {Omit<import('./Piece.js').PieceOptions, 'type'>} options
   */
  constructor(options) {
    super({ ...options, type: 'Land' });
  }

  /**
   * Get all available actions for Land
   * Land can be placed with adjacency requirements
   * @returns {Function[]} Array of action constructors
   */
  getActions() {
    return [LandPlace];
  }

  /**
   * Create a Land piece from JSON data
   * @param {import('./Piece.js').PieceJSON} data
   * @returns {Land}
   */
  static fromJSON(data) {
    return new Land({
      owner: data.owner,
      id: data.id
    });
  }

  /**
   * Check if this Land piece can be placed at the given coordinate
   * @param {import('../engine/Coordinate.js').Coordinate} coordinate - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {boolean} True if the Land can be placed here
   */
  canBePlacedAt(coordinate, gameState) {
    // Land can only be placed in water (where there's no existing terrain)
    return !gameState.hasTerrain(coordinate);
  }

  /**
   * Check if this is a terrain piece
   * @returns {boolean} Always true for Land
   */
  isTerrain() {
    return true;
  }

  /**
   * Check if pieces can be placed on this Land
   * @returns {boolean} Always true - pieces can be placed on Land
   */
  canSupportPieces() {
    return true;
  }
}

/**
 * Land-specific Place action that enforces adjacency rules
 * Land tiles must be placed adjacent (orthogonal or diagonal) to existing terrain
 */

export class LandPlace extends Place {
  /**
   * Check if the Land placement is valid
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after placement
   * @throws {RuleViolation} If the placement is invalid
   */
  check(target, currentGame, newGame) {

    // Call base class validation
    super.check(target, currentGame, newGame);

    // Check Land-specific adjacency requirements
    // Check if there's any terrain on the board
    const hasAnyTerrain = this.hasAnyTerrainOnBoard(currentGame);

    if (hasAnyTerrain) {
      // Must be adjacent to existing terrain
      if (!this.isAdjacentToAnyTerrain(target, currentGame)) {
        throw new RuleViolation('Land must be placed adjacent to existing terrain');
      }
    }
    // If no terrain exists yet, first piece can be placed anywhere
  }

  /**
   * Check if there's any terrain on the board
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {boolean}
   */
  hasAnyTerrainOnBoard(gameState) {
    for (const [key, cell] of gameState.board) {
      if (cell.terrain) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if target coordinate is adjacent to any existing terrain
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {boolean}
   */
  isAdjacentToAnyTerrain(target, gameState) {
    const adjacentCoords = target.getAllAdjacent();
    return adjacentCoords.some(coord => gameState.hasTerrain(coord));
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return `Place Land (adjacent to existing terrain)`;
  }
}
