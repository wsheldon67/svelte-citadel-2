import { Action } from './Action.js';
import { RuleViolation } from '../engine/Errors.js';

/**
 * Base Move action that provides common movement functionality.
 * Other movement actions can extend this class.
 */
export class Move extends Action {
  /**
   * Check if the target is a valid move destination
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the move
   * @throws {RuleViolation} If the move is invalid
   */
  check(targetCell, currentGame, newGame) {
    // Call base class validation
    super.check(targetCell, currentGame, newGame);


    if (!this.piece.coordinate) {
      throw new RuleViolation('Must be on the board to move');
    }
    

    if (this.piece.coordinate && this.piece.coordinate.equals(targetCell.coordinate)) {
      throw new RuleViolation('Cannot move to the same position');
    }
    
    if (targetCell.hasPieceAtLayer(this.piece.layer)) {
      throw new RuleViolation(`There is already piece on the same layer at ${targetCell.coordinate}`);
    }

    if (this.piece.layer > 0 && !targetCell.hasPieceAtLayer(this.piece.layer - 1)) {
      throw new RuleViolation(`Cannot move piece to layer ${this.piece.layer} without a piece on layer ${this.piece.layer - 1}`);
    }
  }

  /**
   * Perform the move action
   * @param {import('../engine/Cell.js').Cell} targetCell - The target cell
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(targetCell, gameState) {
    if (!this.piece.coordinate) {
      throw new Error('Piece must be on the board to move');
    }
    
    // Handle capture if there's an enemy piece at the target
    const capturedPiece = targetCell.hasPiece() && targetCell.getPieceOwner() !== this.piece.owner ? targetCell.piece : null;
    if (capturedPiece) {
      // Send captured piece to graveyard
      gameState.moveToGraveyard(capturedPiece);
    }
    
    // Store the original position for action recording
    const fromCoordinate = this.piece.coordinate;
    
    // Remove piece from current position
    gameState.setPiece(this.piece.coordinate, null);
    
    // Place piece at target position
    gameState.setPiece(targetCell.coordinate, this.piece);
    this.piece._setCoordinate(targetCell.coordinate);
    
    // Record the action
    gameState.addAction({
      type: 'move',
      pieceId: this.piece.id,
      data: {
        from: fromCoordinate.toString(),
        to: targetCell.coordinate.toString(),
        captured: capturedPiece ? capturedPiece.id : null,
        capturedType: capturedPiece ? capturedPiece.type : null,
        capturedOwner: capturedPiece ? capturedPiece.owner : null
      }
    });
  }
  
}
