import { Coordinate } from './Coordinate.js';

/**
 * @typedef {Object} CellJSON
 * @property {string} coordinate - The coordinate key
 * @property {import('../pieces/Piece.js').PieceJSON|null} terrain - The terrain piece JSON
 * @property {import('../pieces/Piece.js').PieceJSON|null} piece - The piece JSON
 */

/**
 * Represents a cell on the game board that can contain terrain and a piece.
 * Provides utility methods for piece authoring and game logic.
 */
export class Cell {
  /**
   * @param {Coordinate} coordinate - The coordinate of this cell
   * @param {import('../pieces/Piece.js').Piece|null} [terrain] - The terrain piece
   * @param {import('../pieces/Piece.js').Piece|null} [piece] - The piece on this cell
   * @param {import('./GameState.js').GameState|null} [gameState] - Reference to the game state
   */
  constructor(coordinate, terrain = null, piece = null, gameState = null) {
    this.coordinate = coordinate;
    this.terrain = terrain;
    this.piece = piece;
    this.gameState = gameState;
  }

  /**
   * Check if this cell has terrain (land, turtle, etc.)
   * @returns {boolean}
   */
  hasTerrain() {
    return this.terrain !== null;
  }

  /**
   * Check if this cell has a piece
   * @returns {boolean}
   */
  hasPiece() {
    return this.piece !== null;
  }

  /**
   * Check if this cell is water (no terrain)
   * @returns {boolean}
   */
  isWater() {
    return !this.hasTerrain();
  }

  /**
   * Check if this cell is empty (no piece)
   * @returns {boolean}
   */
  isEmpty() {
    return !this.hasPiece();
  }

  /**
   * Check if this cell is completely empty (no terrain and no piece)
   * @returns {boolean}
   */
  isCompletelyEmpty() {
    return !this.hasTerrain() && !this.hasPiece();
  }

  /**
   * Check if this cell contains a piece owned by the given player
   * @param {string} playerId - The player ID to check
   * @returns {boolean}
   */
  hasPlayerPiece(playerId) {
    return this.hasPiece() && this.piece?.owner === playerId;
  }

  /**
   * Check if this cell contains an enemy piece relative to the given player
   * @param {string} playerId - The player ID to check against
   * @returns {boolean}
   */
  hasEnemyPiece(playerId) {
    return this.hasPiece() && this.piece?.owner !== playerId;
  }

  /**
   * Check if this cell contains a piece of the specified type
   * @param {string} pieceType - The piece type to check for
   * @returns {boolean}
   */
  hasPieceOfType(pieceType) {
    return this.hasPiece() && this.piece?.type === pieceType;
  }

  /**
   * Check if this cell contains terrain of the specified type
   * @param {string} terrainType - The terrain type to check for
   * @returns {boolean}
   */
  hasTerrainOfType(terrainType) {
    return this.hasTerrain() && this.terrain?.type === terrainType;
  }

  /**
   * Get the type of piece in this cell, or null if no piece
   * @returns {string|null}
   */
  getPieceType() {
    return this.piece ? this.piece.type : null;
  }

  /**
   * Get the type of terrain in this cell, or null if no terrain
   * @returns {string|null}
   */
  getTerrainType() {
    return this.terrain ? this.terrain.type : null;
  }

  /**
   * Get the owner of the piece in this cell, or null if no piece
   * @returns {string|null}
   */
  getPieceOwner() {
    return this.piece ? this.piece.owner : null;
  }

  /**
   * Check if this cell is adjacent to any terrain (if gameState is available)
   * @returns {boolean}
   */
  isAdjacentToTerrain() {
    if (!this.gameState) {
      throw new Error('GameState reference required for adjacency checks');
    }
    return this.gameState.isAdjacentToAnyTerrain(this.coordinate);
  }

  /**
   * Get all adjacent cells (if gameState is available)
   * @returns {Cell[]}
   */
  getAdjacentCells() {
    if (!this.gameState) {
      throw new Error('GameState reference required for getting adjacent cells');
    }
    const adjacentCoords = this.coordinate.getAllAdjacent();
    // Safe to cast since we've already checked gameState is not null
    return adjacentCoords.map(coord => /** @type {Cell} */(this.gameState?.getCell(coord)));
  }

  /**
   * Get all adjacent cells that have terrain
   * @returns {Cell[]}
   */
  getAdjacentTerrainCells() {
    return this.getAdjacentCells().filter(cell => cell.hasTerrain());
  }

  /**
   * Get all adjacent cells that have pieces
   * @returns {Cell[]}
   */
  getAdjacentPieceCells() {
    return this.getAdjacentCells().filter(cell => cell.hasPiece());
  }

  /**
   * Get all adjacent cells that contain enemy pieces relative to the given player
   * @param {string} playerId - The player ID to check against
   * @returns {Cell[]}
   */
  getAdjacentEnemyCells(playerId) {
    return this.getAdjacentCells().filter(cell => cell.hasEnemyPiece(playerId));
  }

  /**
   * Get all adjacent cells that contain friendly pieces for the given player
   * @param {string} playerId - The player ID to check for
   * @returns {Cell[]}
   */
  getAdjacentFriendlyCells(playerId) {
    return this.getAdjacentCells().filter(cell => cell.hasPlayerPiece(playerId));
  }

  /**
   * Check if this cell can be moved to by a piece (has terrain or piece can move to water)
   * @param {boolean} [canMoveToWater=false] - Whether the piece can move to water
   * @returns {boolean}
   */
  canBeMovedTo(canMoveToWater = false) {
    return this.hasTerrain() || canMoveToWater;
  }

  /**
   * Check if this cell can have a piece placed on it
   * @param {boolean} [isTerrainPiece=false] - Whether the piece being placed is terrain
   * @returns {boolean}
   */
  canPlacePiece(isTerrainPiece = false) {
    // Cannot place if there's already a piece
    if (this.hasPiece()) {
      return false;
    }
    
    if (isTerrainPiece) {
      // Terrain cannot be placed where terrain already exists
      return !this.hasTerrain();
    } else {
      // Regular pieces need terrain to be placed on
      return this.hasTerrain();
    }
  }

  /**
   * Create a deep copy of this cell
   * @param {import('./GameState.js').GameState|null} [newGameState] - New game state reference for the copy
   * @returns {Cell}
   */
  copy(newGameState = null) {
    return new Cell(
      this.coordinate,
      this.terrain ? this.terrain.copy() : null,
      this.piece ? this.piece.copy() : null,
      newGameState || this.gameState
    );
  }

  /**
   * Set the terrain for this cell
   * @param {import('../pieces/Piece.js').Piece|null} terrain
   */
  setTerrain(terrain) {
    this.terrain = terrain;
    
    // Update terrain coordinates and game state references
    if (terrain && terrain._setCoordinate && terrain._setGameState && this.gameState) {
      terrain._setCoordinate(this.coordinate);
      terrain._setGameState(this.gameState);
    }
  }

  /**
   * Set the piece for this cell
   * @param {import('../pieces/Piece.js').Piece|null} piece
   */
  setPiece(piece) {
    const prev = this.piece;
    this.piece = piece;
    
    // Update piece coordinates and game state references
    if (prev && prev._setCoordinate) {
      prev._setCoordinate(null);
    }
    if (piece && piece._setCoordinate && piece._setGameState && this.gameState) {
      piece._setCoordinate(this.coordinate);
      piece._setGameState(this.gameState);
    }
  }

  /**
   * Remove both terrain and piece from this cell
   * @returns {{terrain: import('../pieces/Piece.js').Piece|null, piece: import('../pieces/Piece.js').Piece|null}}
   */
  clear() {
    const terrain = this.terrain;
    const piece = this.piece;
    
    this.terrain = null;
    this.piece = null;
    
    // Update piece coordinate
    if (piece && piece._setCoordinate) {
      piece._setCoordinate(null);
    }
    
    return { terrain, piece };
  }

  /**
   * Serialize the cell to JSON
   * @returns {CellJSON}
   */
  toJSON() {
    return {
      coordinate: this.coordinate.key,
      terrain: this.terrain ? this.terrain.toJSON() : null,
      piece: this.piece ? this.piece.toJSON() : null
    };
  }

  /**
   * Create a Cell from JSON data
   * @param {CellJSON} data
   * @param {Function} pieceFromJSON - Function to create pieces from JSON
   * @param {import('./GameState.js').GameState|null} [gameState] - Game state reference
   * @returns {Cell}
   */
  static fromJSON(data, pieceFromJSON, gameState = null) {
    const coordinate = Coordinate.fromKey(data.coordinate);
    const terrain = data.terrain ? pieceFromJSON(data.terrain) : null;
    const piece = data.piece ? pieceFromJSON(data.piece) : null;
    
    return new Cell(coordinate, terrain, piece, gameState);
  }

  /**
   * Create an empty cell at the given coordinate
   * @param {Coordinate} coordinate
   * @param {import('./GameState.js').GameState|null} [gameState] - Game state reference
   * @returns {Cell}
   */
  static empty(coordinate, gameState = null) {
    return new Cell(coordinate, null, null, gameState);
  }

  /**
   * String representation of the cell
   * @returns {string}
   */
  toString() {
    const terrainStr = this.terrain ? `T:${this.terrain.type}` : 'T:none';
    const pieceStr = this.piece ? `P:${this.piece.type}(${this.piece.owner})` : 'P:none';
    return `Cell(${this.coordinate.toString()}, ${terrainStr}, ${pieceStr})`;
  }
}
