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
    
    if (targetCell.hasPieceAtLayer(this.piece.layer)) {
      throw new RuleViolation(`There is already piece on the same layer at ${targetCell.coordinate}`);
    }

    if (this.piece.layer > 0 && !targetCell.hasPieceAtLayer(this.piece.layer - 1)) {
      throw new RuleViolation(`Cannot place piece on layer ${this.piece.layer} without a piece on layer ${this.piece.layer - 1}`);
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