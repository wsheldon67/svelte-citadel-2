import { Action } from './Action.js';
import { RuleViolation } from '../engine/Errors.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Base Place action for placing pieces on the board
 * Handles basic placement validation like checking for existing pieces and terrain layer stacking
 */
export class Place extends Action {
  /**
   * Check if the placement is valid
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after placement
   * @throws {RuleViolation} If the placement is invalid
   */
  check(targetCell, currentGame, newGame) {
    // Skip base class validation since placement doesn't require the piece to already be on the board
    // super.check(targetCell, currentGame, newGame);
    
    // Check if there's already a piece at this location
    if (targetCell.hasPiece()) {
      throw new RuleViolation('Cannot place piece where a piece already exists');
    }
    
    // Check terrain layer stacking rules
    if (this.piece.type === 'Land') {
      // Land is terrain - cannot place where terrain already exists
      if (targetCell.hasTerrain()) {
        throw new RuleViolation('Cannot place terrain where terrain already exists');
      }
    } else {
      // Regular pieces need terrain to place on
      if (!targetCell.hasTerrain() && !this.piece.isTerrain()) {
        throw new RuleViolation('Cannot place piece where no terrain exists (pieces need to be on land)');
      }
    }
  }
  
  /**
   * Perform the placement action
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(targetCell, gameState) {
    // Create a copy of the piece and set its coordinate
    const placedPiece = this.piece.copy();
    placedPiece._setCoordinate(targetCell.coordinate);
    
    // Place the piece in the appropriate layer
    if (this.piece.type === 'Land') {
      gameState.setTerrain(targetCell.coordinate, placedPiece);
    } else {
      gameState.setPiece(targetCell.coordinate, placedPiece);
    }

    // Record the action
    gameState.addAction({
      type: 'place',
      pieceId: this.piece.id,
      data: {
        at: targetCell.coordinate.toString()
      }
    });
  }

  /**
   * Get reasonable search bounds for valid placement
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {{minX: number, maxX: number, minY: number, maxY: number}} Bounds object with minX, maxX, minY, maxY
   */
  getSearchBounds(gameState) {
    // Default bounds - can be overridden by subclasses
    return {
      minX: -10,
      maxX: 10,
      minY: -10,
      maxY: 10
    };
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return `Place ${this.piece.type}`;
  }
}