import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Base class for all actions that pieces can perform.
 * Provides the interface for checking validity and performing actions.
 */
export class Action {
  /**
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing this action
   */
  constructor(piece) {
    this.piece = piece;
    this.name = this.constructor.name;
  }

  /**
   * Check if the action is valid for the given target
   * @param {Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the action
   * @throws {RuleViolation} If the action is invalid
   */
  check(target, currentGame, newGame) {
    // Base implementation - subclasses should override and call super.check()
    if (!this.piece.coordinate) {
      throw new RuleViolation('Piece must be placed on the board to perform actions');
    }
    
    if (currentGame.currentPlayer !== this.piece.owner) {
      throw new RuleViolation('It is not this player\'s turn');
    }
  }

  /**
   * Perform the action
   * @param {Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    // Base implementation - subclasses should override
    throw new Error('Action.perform() must be implemented by subclasses');
  }

  /**
   * Get all valid targets for this action
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    // Base implementation - subclasses should override
    return [];
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return this.name;
  }
}
