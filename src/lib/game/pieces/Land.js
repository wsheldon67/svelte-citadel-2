import { Piece } from './Piece.js';
import { LandPlace } from '../actions/LandPlace.js';

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