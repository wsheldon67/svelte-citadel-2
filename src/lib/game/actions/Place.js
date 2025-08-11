import { Action } from './Action.js';
import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Base Place action for placing pieces on the board
 * Handles basic placement validation like checking for existing pieces and terrain layer stacking
 */
export class Place extends Action {
  /**
   * Check if the placement is valid
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after placement
   * @throws {RuleViolation} If the placement is invalid
   */
  check(target, currentGame, newGame) {
    // Skip base class validation since placement doesn't require the piece to already be on the board
    // super.check(target, currentGame, newGame);
    
    // Check if there's already a piece at this location
    if (currentGame.hasPiece(target)) {
      throw new RuleViolation('Cannot place piece where a piece already exists');
    }
    
    // Check terrain layer stacking rules
    if (this.piece.type === 'Land') {
      // Land is terrain - cannot place where terrain already exists
      if (currentGame.hasTerrain(target)) {
        throw new RuleViolation('Cannot place terrain where terrain already exists');
      }
    } else {
      // Regular pieces need terrain to place on
      if (!currentGame.hasTerrain(target) && !this.piece.isTerrain()) {
        throw new RuleViolation('Cannot place piece where no terrain exists (pieces need to be on land)');
      }
    }
  }
  
  /**
   * Perform the placement action
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    // Create a copy of the piece and set its coordinate
    const placedPiece = this.piece.copy();
    placedPiece._setCoordinate(target);
    
    // Place the piece in the appropriate layer
    if (this.piece.type === 'Land') {
      gameState.setTerrain(target, placedPiece);
    } else {
      gameState.setPiece(target, placedPiece);
    }
  }

  /**
   * Get all valid targets for placing this piece
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {import('../engine/Coordinate.js').Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    const validTargets = [];
    
    // Base implementation: find all empty coordinates
    // Subclasses can override for more specific placement rules
    
    // For now, let's return a reasonable grid around existing pieces/terrain
    const bounds = this.getSearchBounds(gameState);
    
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const coord = new Coordinate(x, y);
        try {
          // Create a temporary game state to test placement
          const testGame = gameState.copy();
          this.check(coord, gameState, testGame);
          validTargets.push(coord);
        } catch (violation) {
          // Invalid placement, skip this coordinate
        }
      }
    }
    
    return validTargets;
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