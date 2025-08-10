import { Action } from './Action.js';
import { RuleViolation } from '../engine/RuleViolation.js';

/**
 * Base Move action that provides common movement functionality.
 * Other movement actions can extend this class.
 */
export class Move extends Action {
  /**
   * Check if the target is a valid move destination
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the move
   * @throws {RuleViolation} If the move is invalid
   */
  check(target, currentGame, newGame) {
    // Call base class validation
    super.check(target, currentGame, newGame);
    
    // Can't move to the same position
    if (this.piece.coordinate && this.piece.coordinate.equals(target)) {
      throw new RuleViolation('Cannot move to the same position');
    }
    
    // Must have terrain (land or turtle) to move to, unless the piece itself can go in water
    if (!currentGame.hasTerrain(target) && !this.canMoveToWater()) {
      throw new RuleViolation('Cannot move to water without terrain');
    }
    
    // Check for piece collision (unless this move captures)
    const targetPiece = currentGame.getPieceAt(target);
    if (targetPiece) {
      if (targetPiece.owner === this.piece.owner) {
        throw new RuleViolation('Cannot move to a square occupied by your own piece');
      }
      // If enemy piece, this would be a capture - validate capture rules
      if (!this.canCapture()) {
        throw new RuleViolation('This piece cannot capture');
      }
    }
  }

  /**
   * Perform the move action
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    if (!this.piece.coordinate) {
      throw new Error('Piece must be on the board to move');
    }
    
    // Handle capture if there's an enemy piece at the target
    const targetPiece = gameState.getPieceAt(target);
    if (targetPiece && targetPiece.owner !== this.piece.owner) {
  // Send captured piece to graveyard
  gameState.moveToGraveyard(targetPiece);
    }
    
    // Store the original position for action recording
    const fromCoordinate = this.piece.coordinate;
    
    // Remove piece from current position
    gameState.setPiece(this.piece.coordinate, null);
    
    // Place piece at target position
    gameState.setPiece(target, this.piece);
    this.piece._setCoordinate(target);
    
    // Record the action
    gameState.addAction({
      type: 'move',
      pieceId: this.piece.id,
      from: fromCoordinate.toString(),
      to: target.toString(),
  captured: targetPiece ? targetPiece.id : null,
  capturedType: targetPiece ? targetPiece.type : null,
  capturedOwner: targetPiece ? targetPiece.owner : null
    });
  }

  /**
   * Check if this piece can move to water
   * Override in subclasses for pieces like Turtle
   * @returns {boolean}
   */
  canMoveToWater() {
    return false;
  }

  /**
   * Check if this piece can capture enemy pieces
   * Override in subclasses to disable capturing
   * @returns {boolean}
   */
  canCapture() {
    return true;
  }

  /**
   * Get all valid move targets for this piece
   * Base implementation - should be overridden by specific movement patterns
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {import('../engine/Coordinate.js').Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    // Base implementation returns empty array
    // Subclasses should override with their specific movement patterns
    return [];
  }
}
