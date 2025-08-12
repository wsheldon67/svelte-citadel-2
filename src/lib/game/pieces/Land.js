import { Piece } from './Piece.js';
import { Place } from '../actions/Place.js';
import { RuleViolation } from '../engine/Errors.js';

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

  layer = 0
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

    // Land cannot be placed where there's already a piece (different from Builder's special capture ability)
    if (targetCell.hasPiece()) {
      throw new RuleViolation('Land cannot be placed where a piece already exists');
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
