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
    const targetCell = gameState.getCell(coordinate);
    return !targetCell.hasTerrain();
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
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after placement
   * @throws {RuleViolation} If the placement is invalid
   */
  check(targetCell, currentGame, newGame) {

    // Call base class validation
    super.check(targetCell, currentGame, newGame);
    
    // Land cannot be placed where terrain already exists
    if (targetCell.hasTerrain()) {
      throw new RuleViolation('Cannot place Land where terrain already exists');
    }

    // Check if there's any terrain on the board
    if (currentGame.hasAnyTerrain()) {
      // Must be adjacent to existing terrain - use Cell's adjacency check
      if (!targetCell.isAdjacentToTerrain()) {
        throw new RuleViolation('Land must be placed adjacent to existing terrain');
      }
    }
    // If no terrain exists yet, first piece can be placed anywhere
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return `Place Land (adjacent to existing terrain)`;
  }
}
