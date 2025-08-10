import { Piece } from './Piece.js';
import { Action } from '../actions/Action.js';
import { Move } from '../actions/Move.js';
import { RuleViolation } from '../engine/RuleViolation.js';
import { Coordinate } from '../engine/Coordinate.js';

/**
 * Builder piece implementation
 * Movement: Moves one square at a time, orthogonally (up, down, left, right)
 * Land Tile Management: Can move, place, and remove land tiles
 * Capture: Can only capture by manipulating land tiles
 */
export class Builder extends Piece {
  /**
   * @param {Omit<import('./Piece.js').PieceOptions, 'type'>} options
   */
  constructor(options) {
    super({ ...options, type: 'Builder' });
  }

  /**
   * Get all available actions for the Builder
   * @returns {Function[]} Array of Action constructor functions
   */
  getActions() {
    return [BuilderMove, BuilderMoveTerrain, BuilderRemoveTerrain, BuilderPlaceTerrain];
  }

  /**
   * Create a builder from JSON data
   * @param {import('./Piece.js').PieceJSON} data
   * @returns {Builder}
   */
  static fromJSON(data) {
    return new Builder({
      owner: data.owner,
      id: data.id
    });
  }
}

/**
 * Builder-specific movement action
 * Extends the base Move class with Builder-specific movement rules
 */
export class BuilderMove extends Move {
  /**
   * Check if the target is a valid move for the Builder
   * @param {import('../engine/Coordinate.js').Coordinate} target - The target tile to check
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the move
   * @throws {RuleViolation} If the move is invalid
   */
  check(target, currentGame, newGame) {
    // Ensure piece is on the board first for a clearer error
    if (!this.piece.coordinate) {
      throw new RuleViolation('Builder must be on the board to move');
    }

    // Validate adjacency first so diagonal attempts produce the expected error message
    if (!this.piece.isOrthogonallyAdjacentTo(target)) {
      throw new RuleViolation('Builder can only move to orthogonally adjacent squares');
    }

    // Then run base class validation (water, collisions, turn, etc.)
    super.check(target, currentGame, newGame);
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Move Builder one square orthogonally';
  }

  /**
   * Get all valid move targets for the Builder
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    if (!this.piece.coordinate) {
      return [];
    }

    const targets = [];
    const directions = [
      { x: 0, y: 1 },   // North
      { x: 1, y: 0 },   // East
      { x: 0, y: -1 },  // South
      { x: -1, y: 0 }   // West
    ];

    for (const direction of directions) {
      const target = new Coordinate(
        this.piece.coordinate.x + direction.x,
        this.piece.coordinate.y + direction.y
      );
      
      // Must have terrain to move to (unless piece can move to water)
      if (gameState.hasTerrain(target) || this.canMoveToWater()) {
        const targetPiece = gameState.getPieceAt(target);
        // Can move if empty or has enemy piece (can capture)
        if (!targetPiece || (targetPiece.owner !== this.piece.owner && this.canCapture())) {
          targets.push(target);
        }
      }
    }

    return targets;
  }
}

/**
 * Builder action to move a land tile from one position to another
 */
export class BuilderMoveTerrain extends Action {
  /**
   * @param {import('../pieces/Piece.js').Piece} piece - The Builder piece
   * @param {Coordinate|null} sourceCoordinate - The coordinate of the land tile to move
   */
  constructor(piece, sourceCoordinate = null) {
    super(piece);
    this.sourceCoordinate = sourceCoordinate;
  }

  /**
   * Check if the terrain movement is valid
   * @param {Coordinate} target - The target coordinate for the land tile
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the action
   * @throws {RuleViolation} If the action is invalid
   */
  check(target, currentGame, newGame) {
    super.check(target, currentGame, newGame);

    if (!this.sourceCoordinate) {
      throw new RuleViolation('Source coordinate must be specified for terrain movement');
    }

    // Builder must be orthogonally adjacent to the source terrain
    if (!this.piece.isOrthogonallyAdjacentTo(this.sourceCoordinate)) {
      throw new RuleViolation('Builder must be orthogonally adjacent to the terrain to move');
    }

    // Source must have terrain (land tile)
    const sourceTerrain = currentGame.getTerrainAt(this.sourceCoordinate);
    if (!sourceTerrain || sourceTerrain.type !== 'Land') {
      throw new RuleViolation('Source coordinate must have a land tile');
    }

    // Target must be orthogonally adjacent to the source terrain
    if (!this.sourceCoordinate.isOrthogonallyAdjacentTo(target)) {
      throw new RuleViolation('Land tile can only be moved to orthogonally adjacent positions');
    }
  }

  /**
   * Perform the terrain movement
   * @param {Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    if (!this.sourceCoordinate) {
      throw new RuleViolation('Source coordinate must be specified for terrain movement');
    }

    // Get the terrain to move
    const terrain = gameState.removeTerrain(this.sourceCoordinate);
    
    // If there was a piece on the source terrain, move it to graveyard
    const sourceCell = gameState.getCell(this.sourceCoordinate);
    if (sourceCell.piece) {
      gameState.moveToGraveyard(sourceCell.piece);
      gameState.setPiece(this.sourceCoordinate, null);
    }

    // If target has a piece, capture it
    const targetPiece = gameState.getPieceAt(target);
    if (targetPiece) {
      gameState.moveToGraveyard(targetPiece);
      gameState.setPiece(target, null);
    }

    // Place the terrain at the target
    gameState.setTerrain(target, terrain);
  }

  /**
   * Get all valid targets for moving terrain from the source coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    if (!this.piece.coordinate || !this.sourceCoordinate) {
      return [];
    }

    // Check if Builder is adjacent to source and source has land
    if (!this.piece.isOrthogonallyAdjacentTo(this.sourceCoordinate)) {
      return [];
    }

    const sourceTerrain = gameState.getTerrainAt(this.sourceCoordinate);
    if (!sourceTerrain || sourceTerrain.type !== 'Land') {
      return [];
    }

    // Get all orthogonally adjacent positions to the source terrain
    const targets = [];
    const directions = [
      { x: 0, y: 1 },   // North
      { x: 1, y: 0 },   // East
      { x: 0, y: -1 },  // South
      { x: -1, y: 0 }   // West
    ];

    for (const direction of directions) {
      const target = new Coordinate(
        this.sourceCoordinate.x + direction.x,
        this.sourceCoordinate.y + direction.y
      );
      targets.push(target);
    }

    return targets;
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Move land tile to adjacent position';
  }
}

/**
 * Builder action to remove a land tile
 */
export class BuilderRemoveTerrain extends Action {
  /**
   * Check if the terrain removal is valid
   * @param {Coordinate} target - The coordinate of the terrain to remove
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the action
   * @throws {RuleViolation} If the action is invalid
   */
  check(target, currentGame, newGame) {
    super.check(target, currentGame, newGame);

    // Builder must be orthogonally adjacent to the target
    if (!this.piece.isOrthogonallyAdjacentTo(target)) {
      throw new RuleViolation('Builder must be orthogonally adjacent to the terrain to remove');
    }

    // Target must have terrain (land tile)
    const terrain = currentGame.getTerrainAt(target);
    if (!terrain || terrain.type !== 'Land') {
      throw new RuleViolation('Target coordinate must have a land tile to remove');
    }
  }

  /**
   * Perform the terrain removal
   * @param {Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    // Check if Builder is removing its own tile (edge case)
    const builderOnTarget = this.piece.coordinate && this.piece.coordinate.equals(target);
    
    // Remove all contents from the target cell
    gameState.removeCellContents(target);

    // If Builder was on the removed tile, move it to graveyard too
    if (builderOnTarget) {
      gameState.moveToGraveyard(this.piece);
      // Note: The piece's coordinate should be updated by the game engine
    }
  }

  /**
   * Get all valid targets for terrain removal
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    if (!this.piece.coordinate) {
      return [];
    }

    const targets = [];
    const directions = [
      { x: 0, y: 1 },   // North
      { x: 1, y: 0 },   // East
      { x: 0, y: -1 },  // South
      { x: -1, y: 0 }   // West
    ];

    for (const direction of directions) {
      const target = new Coordinate(
        this.piece.coordinate.x + direction.x,
        this.piece.coordinate.y + direction.y
      );
      const terrain = gameState.getTerrainAt(target);
      
      if (terrain && terrain.type === 'Land') {
        targets.push(target);
      }
    }

    return targets;
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Remove land tile';
  }
}

/**
 * Builder action to place a land tile from the community pool
 */
export class BuilderPlaceTerrain extends Action {
  /**
   * Check if the terrain placement is valid
   * @param {Coordinate} target - The coordinate to place the terrain
   * @param {import('../engine/GameState.js').GameState} currentGame - The current game state
   * @param {import('../engine/GameState.js').GameState} newGame - The new game state after the action
   * @throws {RuleViolation} If the action is invalid
   */
  check(target, currentGame, newGame) {
    super.check(target, currentGame, newGame);

    // Builder must be orthogonally adjacent to the target
    if (!this.piece.isOrthogonallyAdjacentTo(target)) {
      throw new RuleViolation('Builder must be orthogonally adjacent to the placement location');
    }

    // Target must be water (no terrain)
    if (currentGame.hasTerrain(target)) {
      throw new RuleViolation('Cannot place terrain on existing terrain');
    }

    // Must have land available in community pool
    const hasLand = currentGame.communityPool.some(piece => piece.type === 'Land');
    if (!hasLand) {
      throw new RuleViolation('No land tiles available in community pool');
    }
  }

  /**
   * Perform the terrain placement
   * @param {Coordinate} target - The target coordinate
   * @param {import('../engine/GameState.js').GameState} gameState - The game state to modify
   */
  perform(target, gameState) {
    // Get land from community pool
    const landTile = gameState.getLandFromCommunityPool();
    if (!landTile) {
      throw new RuleViolation('No land tiles available in community pool');
    }

    // If target has a piece on water, capture it
    const targetPiece = gameState.getPieceAt(target);
    if (targetPiece) {
      gameState.moveToGraveyard(targetPiece);
      gameState.setPiece(target, null);
    }

    // Place the land tile
    gameState.setTerrain(target, landTile);
  }

  /**
   * Get all valid targets for terrain placement
   * @param {import('../engine/GameState.js').GameState} gameState - The current game state
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargets(gameState) {
    if (!this.piece.coordinate) {
      return [];
    }

    // Check if land is available
    const hasLand = gameState.communityPool.some(piece => piece.type === 'Land');
    if (!hasLand) {
      return [];
    }

    const targets = [];
    const directions = [
      { x: 0, y: 1 },   // North
      { x: 1, y: 0 },   // East
      { x: 0, y: -1 },  // South
      { x: -1, y: 0 }   // West
    ];

    for (const direction of directions) {
      const target = new Coordinate(
        this.piece.coordinate.x + direction.x,
        this.piece.coordinate.y + direction.y
      );
      
      // Must be water (no terrain)
      if (!gameState.hasTerrain(target)) {
        targets.push(target);
      }
    }

    return targets;
  }

  /**
   * Get a human-readable description of this action
   * @returns {string}
   */
  getDescription() {
    return 'Place land tile from community pool';
  }
}
