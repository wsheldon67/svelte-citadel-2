import { Coordinate } from './Coordinate.js';

/**
 * @typedef {Object} Cell
 * @property {import('../pieces/Piece.js').Piece|null} terrain - The terrain piece (Land, Turtle, etc.)
 * @property {import('../pieces/Piece.js').Piece|null} piece - The piece on this cell
 */

/**
 * @typedef {Object} GameStateOptions
 * @property {boolean} [isSimulation] - Flag to prevent recursive validation
 */

/**
 * @typedef {Object} CopyOptions
 * @property {boolean} [isSimulation] - Whether the copy is for simulation
 */

/**
 * @typedef {Object} PieceLocation
 * @property {Coordinate} coordinate - The coordinate of the piece
 * @property {import('../pieces/Piece.js').Piece} piece - The piece object
 */

/**
 * @typedef {Object} BoardCellJSON
 * @property {string} coordinate - The coordinate key
 * @property {import('../pieces/Piece.js').PieceJSON|null} terrain - The terrain piece JSON
 * @property {import('../pieces/Piece.js').PieceJSON|null} piece - The piece JSON
 */

/**
 * @typedef {Object} PlayerStashJSON
 * @property {string} playerId - The player identifier
 * @property {import('../pieces/Piece.js').PieceJSON[]} stash - Array of piece JSON objects
 */

/**
 * @typedef {Object} ActionHistoryEntry
 * @property {string} name - The action name
 * @property {Object} [data] - Action-specific data
 * @property {string} timestamp - ISO timestamp when action was recorded
 * @property {number} turnNumber - Turn number when action was performed
 * @property {string} player - Player who performed the action
 */

/**
 * @typedef {Object} GameStateJSON
 * @property {BoardCellJSON[]} board - Array of board cells with pieces/terrain
 * @property {string[]} players - Array of player identifiers
 * @property {number} currentPlayerIndex - Index of current player in players array
 * @property {number} turnNumber - Current turn number
 * @property {PlayerStashJSON[]} playerStashes - Array of player stashes
 * @property {import('../pieces/Piece.js').PieceJSON[]} communityPool - Array of pieces in community pool
 * @property {import('../pieces/Piece.js').PieceJSON[]} graveyard - Array of pieces in graveyard
 * @property {ActionHistoryEntry[]} actionHistory - Array of actions performed
 * @property {string} createdAt - ISO timestamp when game state was created
 * @property {string} lastModified - ISO timestamp when game state was last modified
 */

/**
 * Represents the complete game state, designed to be deep copyable.
 * The current game state can always be derived from the initial state and actions taken.
 */
export class GameState {
  /**
   * @param {GameStateOptions} [options]
   */
  constructor(options = {}) {
    this.isSimulation = options.isSimulation || false;
    
    // Core game state
    /** @type {Map<string, Cell>} */
    this.board = new Map(); // coordinate.key -> { terrain: piece|null, piece: piece|null }
    
    /** @type {string[]} */
    this.players = [];
    
    /** @type {number} */
    this.currentPlayerIndex = 0;
    
    /** @type {number} */
    this.turnNumber = 1;
    
    // Piece collections
    /** @type {Map<string, import('../pieces/Piece.js').Piece[]>} */
    this.playerStashes = new Map(); // playerId -> pieces[]
    
    /** @type {import('../pieces/Piece.js').Piece[]} */
    this.communityPool = [];
    
    /** @type {import('../pieces/Piece.js').Piece[]} */
    this.graveyard = [];
    
    // Action history for replay and undo
    /** @type {Object[]} */
    this.actionHistory = [];
    
    // Game metadata
    /** @type {Date} */
    this.createdAt = new Date();
    
    /** @type {Date} */
    this.lastModified = new Date();
  }

  /**
   * Get the current player
   * @returns {string}
   */
  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Create a deep copy of the game state
   * @param {CopyOptions} [options]
   * @returns {GameState}
   */
  copy(options = {}) {
    const newState = new GameState({ 
      isSimulation: options.isSimulation !== undefined ? options.isSimulation : this.isSimulation 
    });
    
    // Deep copy board
    newState.board = new Map();
    for (const [key, cell] of this.board) {
      newState.board.set(key, {
        terrain: cell.terrain ? cell.terrain.copy() : null,
        piece: cell.piece ? cell.piece.copy() : null
      });
    }
    
    // Copy arrays and maps
    newState.players = [...this.players];
    newState.currentPlayerIndex = this.currentPlayerIndex;
    newState.turnNumber = this.turnNumber;
    
    // Deep copy piece collections
    newState.playerStashes = new Map();
    for (const [playerId, stash] of this.playerStashes) {
      newState.playerStashes.set(playerId, stash.map(piece => piece.copy()));
    }
    
    newState.communityPool = this.communityPool.map(piece => piece.copy());
    newState.graveyard = this.graveyard.map(piece => piece.copy());
    
    // Copy action history (actions should be immutable)
    newState.actionHistory = [...this.actionHistory];
    
    // Copy metadata
    newState.createdAt = new Date(this.createdAt);
    newState.lastModified = new Date(this.lastModified);
    
    return newState;
  }

  /**
   * Get the cell at a coordinate
   * @param {Coordinate} coordinate
   * @returns {Cell} { terrain: piece|null, piece: piece|null }
   */
  getCell(coordinate) {
    return this.board.get(coordinate.key) || { terrain: null, piece: null };
  }

  /**
   * Set the terrain at a coordinate
   * @param {Coordinate} coordinate
   * @param {import('../pieces/Piece.js').Piece|null} terrainPiece
   */
  setTerrain(coordinate, terrainPiece) {
    const cell = this.getCell(coordinate);
    cell.terrain = terrainPiece;
    this.board.set(coordinate.key, cell);
    this._updateLastModified();
  }

  /**
   * Set the piece at a coordinate
   * @param {Coordinate} coordinate
   * @param {import('../pieces/Piece.js').Piece|null} piece
   */
  setPiece(coordinate, piece) {
    const cell = this.getCell(coordinate);
    cell.piece = piece;
    this.board.set(coordinate.key, cell);
    this._updateLastModified();
  }

  /**
   * Get the terrain piece at a coordinate
   * @param {Coordinate} coordinate
   * @returns {import('../pieces/Piece.js').Piece|null}
   */
  getTerrainAt(coordinate) {
    return this.getCell(coordinate).terrain;
  }

  /**
   * Get the piece at a coordinate
   * @param {Coordinate} coordinate
   * @returns {import('../pieces/Piece.js').Piece|null}
   */
  getPieceAt(coordinate) {
    return this.getCell(coordinate).piece;
  }

  /**
   * Check if a coordinate has terrain (land or turtle)
   * @param {Coordinate} coordinate
   * @returns {boolean}
   */
  hasTerrain(coordinate) {
    return this.getTerrainAt(coordinate) !== null;
  }

  /**
   * Check if a coordinate has a piece
   * @param {Coordinate} coordinate
   * @returns {boolean}
   */
  hasPiece(coordinate) {
    return this.getPieceAt(coordinate) !== null;
  }

  /**
   * Check if a coordinate is water (no terrain)
   * @param {Coordinate} coordinate
   * @returns {boolean}
   */
  isWater(coordinate) {
    return !this.hasTerrain(coordinate);
  }

  /**
   * Get all coordinates that have terrain
   * @returns {Coordinate[]}
   */
  getAllTerrainCoordinates() {
    const coordinates = [];
    for (const [key, cell] of this.board) {
      if (cell.terrain) {
        coordinates.push(Coordinate.fromKey(key));
      }
    }
    return coordinates;
  }

  /**
   * Get all coordinates that have pieces
   * @returns {Coordinate[]}
   */
  getAllPieceCoordinates() {
    const coordinates = [];
    for (const [key, cell] of this.board) {
      if (cell.piece) {
        coordinates.push(Coordinate.fromKey(key));
      }
    }
    return coordinates;
  }

  /**
   * Find pieces of a specific type
   * @param {string} pieceType
   * @param {string|null} [playerId] - Optional filter by player
   * @returns {PieceLocation[]} Array of {coordinate, piece} objects
   */
  findPieces(pieceType, playerId = null) {
    const pieces = [];
    for (const [key, cell] of this.board) {
      if (cell.piece && cell.piece.type === pieceType) {
        if (!playerId || cell.piece.owner === playerId) {
          pieces.push({
            coordinate: Coordinate.fromKey(key),
            piece: cell.piece
          });
        }
      }
    }
    return pieces;
  }

  /**
   * Get the extents of the current board (min/max coordinates of all pieces and terrain)
   * @returns {{minX: number, maxX: number, minY: number, maxY: number}} Board extents
   */
  getBoardExtents() {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    let hasAnyPieces = false;

    for (const [key, cell] of this.board) {
      if (cell.piece || cell.terrain) {
        const coord = Coordinate.fromKey(key);
        if (!hasAnyPieces) {
          // First piece/terrain found, initialize extents
          minX = maxX = coord.x;
          minY = maxY = coord.y;
          hasAnyPieces = true;
        } else {
          minX = Math.min(minX, coord.x);
          maxX = Math.max(maxX, coord.x);
          minY = Math.min(minY, coord.y);
          maxY = Math.max(maxY, coord.y);
        }
      }
    }

    // If no pieces on board, return a default small area around origin
    if (!hasAnyPieces) {
      return { minX: -5, maxX: 5, minY: -5, maxY: 5 };
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Add a piece to the community pool
   * @param {import('../pieces/Piece.js').Piece} piece
   */
  addToCommunityPool(piece) {
    this.communityPool.push(piece);
    this._updateLastModified();
  }

  /**
   * Remove a piece from the community pool
   * @param {import('../pieces/Piece.js').Piece} piece
   * @returns {boolean} True if the piece was found and removed
   */
  removeFromCommunityPool(piece) {
    const index = this.communityPool.indexOf(piece);
    if (index >= 0) {
      this.communityPool.splice(index, 1);
      this._updateLastModified();
      return true;
    }
    return false;
  }

  /**
   * Get a land tile from the community pool if available
   * @returns {import('../pieces/Piece.js').Piece|null} Land piece or null if none available
   */
  getLandFromCommunityPool() {
    const landIndex = this.communityPool.findIndex(piece => piece.type === 'Land');
    if (landIndex >= 0) {
      const land = this.communityPool[landIndex];
      this.communityPool.splice(landIndex, 1);
      this._updateLastModified();
      return land;
    }
    return null;
  }

  /**
   * Remove terrain from a coordinate and return it
   * @param {Coordinate} coordinate
   * @returns {import('../pieces/Piece.js').Piece|null} The removed terrain piece or null
   */
  removeTerrain(coordinate) {
    const cell = this.getCell(coordinate);
    const terrain = cell.terrain;
    if (terrain) {
      cell.terrain = null;
      this.board.set(coordinate.key, cell);
      this._updateLastModified();
    }
    return terrain;
  }

  /**
   * Move a piece to the graveyard
   * @param {import('../pieces/Piece.js').Piece} piece
   */
  moveToGraveyard(piece) {
    this.graveyard.push(piece);
    this._updateLastModified();
  }

  /**
   * Remove both terrain and piece at a coordinate, handling graveyard/community pool appropriately
   * @param {Coordinate} coordinate
   * @returns {{terrain: import('../pieces/Piece.js').Piece|null, piece: import('../pieces/Piece.js').Piece|null}}
   */
  removeCellContents(coordinate) {
    const cell = this.getCell(coordinate);
    const terrain = cell.terrain;
    const piece = cell.piece;

    // Clear the cell
    cell.terrain = null;
    cell.piece = null;
    this.board.set(coordinate.key, cell);

    // Move terrain to community pool if it exists
    if (terrain) {
      this.addToCommunityPool(terrain);
    }

    // Move piece to graveyard if it exists
    if (piece) {
      this.moveToGraveyard(piece);
    }

    this._updateLastModified();
    return { terrain, piece };
  }

  /**
   * Add a player to the game
   * @param {string} playerId
   */
  addPlayer(playerId) {
    if (!this.players.includes(playerId)) {
      this.players.push(playerId);
      this.playerStashes.set(playerId, []);
    }
    this._updateLastModified();
  }

  /**
   * Advance to the next player's turn
   */
  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === 0) {
      this.turnNumber++;
    }
    this._updateLastModified();
  }

  /**
   * Add an action to the history
   * @param {Object} action
   */
  addAction(action) {
    this.actionHistory.push({
      ...action,
      timestamp: new Date(),
      turnNumber: this.turnNumber,
      player: this.currentPlayer
    });
    this._updateLastModified();
  }

  /**
   * Update the last modified timestamp
   * @private
   */
  _updateLastModified() {
    if (!this.isSimulation) {
      this.lastModified = new Date();
    }
  }

  /**
   * Serialize the game state to JSON
   * @returns {Object}
   */
  toJSON() {
    const boardArray = [];
    for (const [key, cell] of this.board) {
      if (cell.terrain || cell.piece) {
        boardArray.push({
          coordinate: key,
          terrain: cell.terrain ? cell.terrain.toJSON() : null,
          piece: cell.piece ? cell.piece.toJSON() : null
        });
      }
    }

    const playerStashesArray = [];
    for (const [playerId, stash] of this.playerStashes) {
      playerStashesArray.push({ 
        playerId, 
        stash: stash.map(piece => piece.toJSON()) 
      });
    }

    return {
      board: boardArray,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      turnNumber: this.turnNumber,
      playerStashes: playerStashesArray,
      communityPool: this.communityPool.map(piece => piece.toJSON()),
      graveyard: this.graveyard.map(piece => piece.toJSON()),
      actionHistory: this.actionHistory,
      createdAt: this.createdAt.toISOString(),
      lastModified: this.lastModified.toISOString()
    };
  }

  /**
   * Create a GameState from JSON data
   * @param {GameStateJSON} data
   * @param {Function} pieceFromJSON - Function to create pieces from JSON
   * @returns {GameState}
   */
  static fromJSON(data, pieceFromJSON) {
    const state = new GameState();
    
    // Restore board
    state.board = new Map();
    for (const cell of data.board) {
      state.board.set(cell.coordinate, {
        terrain: cell.terrain ? pieceFromJSON(cell.terrain) : null,
        piece: cell.piece ? pieceFromJSON(cell.piece) : null
      });
    }
    
    // Restore other properties
    state.players = data.players;
    state.currentPlayerIndex = data.currentPlayerIndex;
    state.turnNumber = data.turnNumber;
    
    // Restore player stashes
    state.playerStashes = new Map();
    for (const { playerId, stash } of data.playerStashes) {
      state.playerStashes.set(playerId, stash.map(pieceData => pieceFromJSON(pieceData)));
    }
    
    state.communityPool = data.communityPool.map(pieceData => pieceFromJSON(pieceData));
    state.graveyard = data.graveyard.map(pieceData => pieceFromJSON(pieceData));
    state.actionHistory = data.actionHistory;
    state.createdAt = new Date(data.createdAt);
    state.lastModified = new Date(data.lastModified);
    
    return state;
  }
}
