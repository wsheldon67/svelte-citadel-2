import { Piece } from './Piece.js';
import { Move } from '../actions/Move.js';
import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Soldier piece implementation
 * Movement: Moves one square at a time, orthogonally or diagonally
 * Capture: Captures any piece it lands on during its move
 */
export class Soldier extends Piece {
  /**
   * @param {Omit<import('./Piece.js').PieceOptions, 'type'>} options
   */
  constructor(options) {
    super({ ...options, type: 'Soldier' });
  }

  /**
   * Get all available actions for the Soldier
   * @returns {Function[]} Array of Action constructor functions
   */
  getActions() {
    return [SoldierMove];
  }

  /**
   * Create a soldier from JSON data
   * @param {import('./Piece.js').PieceJSON} data
   * @returns {Soldier}
   */
  static fromJSON(data) {
    return new Soldier({
      owner: data.owner,
      id: data.id
    });
  }
}

/**
 * Soldier-specific movement action
 * Extends the base Move class with Soldier-specific movement rules
 */
export class SoldierMove extends Move {
  /**
   * Check if the target is a valid move for the Soldier
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target tile to check
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the move
   * @throws {RuleViolation} If the move is invalid
   */
  check(target, currentGame, newGame) {
    // Call base class validation (includes basic move rules)
    super.check(target, currentGame, newGame);
    
    if (!this.piece.coordinate) {
      throw new RuleViolation('Soldier must be on the board to move');
    }
    
    // Soldier can only move to adjacent squares (orthogonal or diagonal)
    if (!this.piece.isAdjacentTo(target)) {
      throw new RuleViolation('Soldier can only move to adjacent squares');
    }
  }

  /**
   * Get all valid targets for Soldier movement
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {import('../engine/Coordinate.js').Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    if (!this.piece.coordinate) {
      return [];
    }

    const targets = [];
    
    // Get all adjacent coordinates (orthogonal + diagonal)
    const adjacentCoords = this.piece.coordinate.getAllAdjacent();

    for (const coord of adjacentCoords) {
      // Check if there's terrain to move to (or if this piece can move to water)
      if (gameState.hasTerrain(coord) || this.canMoveToWater()) {
        const occupyingPiece = gameState.getPieceAt(coord);
        
        // If empty, can move there
        if (!occupyingPiece) {
          targets.push(coord);
        } 
        // If enemy piece, can capture
        else if (occupyingPiece.owner !== this.piece.owner) {
          targets.push(coord);
        }
        // Can't move to friendly pieces (handled by base validation)
      }
    }

    return targets;
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Move Soldier one square';
  }
}
