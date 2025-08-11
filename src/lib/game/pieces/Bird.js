import { Piece } from './Piece.js';
import { Move } from '../actions/Move.js';
import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Bird piece implementation
 * Movement: Moves in straight lines (orthogonally) for any distance
 * Capture: Can capture any piece it lands on during its move
 */
export class Bird extends Piece {
  /**
   * @param {Omit<import('./Piece.js').PieceOptions, 'type'>} options
   */
  constructor(options) {
    super({ ...options, type: 'Bird' });
  }

  /**
   * Get all available actions for the Bird
   * @returns {Function[]} Array of Action constructor functions
   */
  getActions() {
    return [BirdMove];
  }
}

/**
 * Bird-specific movement action
 * Extends the base Move class with Bird-specific movement rules
 */
export class BirdMove extends Move {
  /**
   * Check if the target is a valid move for the Bird
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell to check
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the move
   * @throws {RuleViolation} If the move is invalid
   */
  check(targetCell, currentGame, newGame) {
    // Call base class validation (includes basic move rules)
    super.check(targetCell, currentGame, newGame);
    
    if (!this.piece.coordinate) {
      throw new RuleViolation('Bird must be on the board to move');
    }
    
    // Bird can only move orthogonally (no gaps allowed for adjacency, but line movement allowed)
    if (!this.piece.isOrthogonalTo(targetCell.coordinate, { gapsAllowed: true })) {
      throw new RuleViolation('Bird can only move to orthogonal tiles');
    }
    
    // Check if the path is clear (no pieces blocking the way)
    if (!this.piece.isPathClear(targetCell.coordinate)) {
      throw new RuleViolation('Bird cannot jump over pieces');
    }
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Move Bird orthogonally';
  }
}
