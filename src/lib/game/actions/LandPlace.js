import { Place } from './Place.js';
import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Land-specific Place action that enforces adjacency rules
 * Land tiles must be placed adjacent (orthogonal or diagonal) to existing terrain
 */
export class LandPlace extends Place {
  /**
   * Check if the Land placement is valid
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after placement
   * @throws {RuleViolation} If the placement is invalid
   */
  check(target, currentGame, newGame) {
    // Ensure this is a Land piece first
    if (this.piece.type !== 'Land') {
      throw new RuleViolation('LandPlace action can only be used with Land pieces');
    }
    
    // Call base class validation
    super.check(target, currentGame, newGame);
    
    // Check Land-specific adjacency requirements
    this.checkLandPlacementRules(target, currentGame);
  }
  
  /**
   * Check specific rules for Land placement
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @throws {RuleViolation} If the Land placement violates rules
   */
  checkLandPlacementRules(target, currentGame) {
    // Check if there's any terrain on the board
    const hasAnyTerrain = this.hasAnyTerrainOnBoard(currentGame);
    
    if (hasAnyTerrain) {
      // Must be adjacent to existing terrain
      const isAdjacentToTerrain = this.isAdjacentToAnyTerrain(target, currentGame);
      if (!isAdjacentToTerrain) {
        throw new RuleViolation('Land must be placed adjacent to existing terrain');
      }
    }
    // If no terrain exists yet, first piece can be placed anywhere
  }
  
  /**
   * Check if there's any terrain on the board
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {boolean}
   */
  hasAnyTerrainOnBoard(gameState) {
    for (const [key, cell] of gameState.board) {
      if (cell.terrain) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if target coordinate is adjacent to any existing terrain
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {boolean}
   */
  isAdjacentToAnyTerrain(target, gameState) {
    const adjacentCoords = target.getAllAdjacent();
    return adjacentCoords.some(coord => gameState.hasTerrain(coord));
  }

  /**
   * Get all valid targets for placing Land
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {import('../engine/Coordinate.js').Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    const validTargets = [];
    
    // Check if there's any terrain on the board
    const hasAnyTerrain = this.hasAnyTerrainOnBoard(gameState);
    
    if (!hasAnyTerrain) {
      // First piece can be placed anywhere - but let's limit to a reasonable area
      // around origin for practical purposes
      for (let x = -10; x <= 10; x++) {
        for (let y = -10; y <= 10; y++) {
          const coord = new Coordinate(x, y);
          if (!gameState.hasTerrain(coord) && !gameState.hasPiece(coord)) {
            validTargets.push(coord);
          }
        }
      }
    } else {
      // Find all coordinates adjacent to existing terrain
      const checkedCoords = new Set();
      
      for (const [key, cell] of gameState.board) {
        if (cell.terrain) {
          const terrainCoord = cell.terrain.coordinate;
          if (terrainCoord) {
            const adjacentCoords = terrainCoord.getAllAdjacent();
            
            for (const coord of adjacentCoords) {
              const coordKey = coord.key;
              if (!checkedCoords.has(coordKey)) {
                checkedCoords.add(coordKey);
                
                // Valid if no terrain and no piece at this location
                if (!gameState.hasTerrain(coord) && !gameState.hasPiece(coord)) {
                  validTargets.push(coord);
                }
              }
            }
          }
        }
      }
    }
    
    return validTargets;
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return `Place Land (adjacent to existing terrain)`;
  }
}
