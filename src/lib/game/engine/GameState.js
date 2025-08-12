import { Coordinate } from './Coordinate.js';
import { Cell } from './Cell.js';

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
 * @typedef {Object} PlayerInfo
 * @property {string} id - The player identifier
 * @property {string} name - The player display name
 */

/**
 * @typedef {Object} GameStateJSON
 * @property {string|null} gameId - The game identifier for Firestore
 * @property {BoardCellJSON[]} board - Array of board cells with pieces/terrain
 * @property {string[]} players - Array of player identifiers
 * @property {PlayerInfo[]} playerInfo - Array of player info objects with id and name
 * @property {number} currentPlayerIndex - Index of current player in players array
 * @property {number} turnNumber - Current turn number
 * @property {PlayerStashJSON[]} playerStashes - Array of player stashes
 * @property {import('../pieces/Piece.js').PieceJSON[]} communityPool - Array of pieces in community pool
 * @property {import('../pieces/Piece.js').PieceJSON[]} graveyard - Array of pieces in graveyard
 * @property {ActionHistoryEntry[]} actionHistory - Array of actions performed
 * @property {string} createdAt - ISO timestamp when game state was created
 * @property {string} lastModified - ISO timestamp when game state was last modified
 * @property {string} phase - Current game phase ('lobby', 'land', 'citadel', 'done')
 * @property {string|null} hostPlayerId - ID of the player who is the host
 * @property {Object|null} setup - Game setup configuration
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
    
    // Game identifier for Firestore
    /** @type {string|null} */
    this.gameId = null;
    
    // Core game state
    /** @type {Map<string, Cell>} */
    this.board = new Map(); // coordinate.key -> Cell instance
    
    /** @type {string[]} */
    this.players = [];
    
    /** @type {PlayerInfo[]} */
    this.playerInfo = [];
    
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
    
    // Game flow state
    /** @type {'lobby'|'land'|'citadel'|'done'} */
    this.phase = 'lobby';
    
    /** @type {string|null} */
    this.hostPlayerId = null;
    
    /** @type {Object|null} */
    this.setup = null;
  }

  /**
   * Get the current player
   * @returns {string}
   */
  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Check if a player is the host
   * @param {string} playerId 
   * @returns {boolean}
   */
  isHost(playerId) {
    return this.hostPlayerId === playerId;
  }

  /**
   * Set the host player
   * @param {string} playerId 
   */
  setHost(playerId) {
    this.hostPlayerId = playerId;
    this._updateLastModified();
  }

  /**
   * Set the game phase
   * @param {'lobby'|'land'|'citadel'|'done'} phase 
   */
  setPhase(phase) {
    this.phase = phase;
    this._updateLastModified();
  }

  /**
   * Set the game setup configuration
   * @param {Object} setup 
   */
  setSetup(setup) {
    this.setup = setup;
    this._updateLastModified();
  }

  /**
   * Set the game ID for Firestore operations
   * @param {string} gameId 
   */
  setGameId(gameId) {
    this.gameId = gameId;
    this._updateLastModified();
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
      const coord = Coordinate.fromKey(key);
      newState.board.set(key, new Cell(
        coord,
        cell.terrain ? cell.terrain.copy() : null,
        cell.piece ? cell.piece.copy() : null,
        newState
      ));
    }
    
    // Copy arrays and maps
    newState.players = [...this.players];
    newState.playerInfo = this.playerInfo.map(info => ({ ...info }));
    newState.currentPlayerIndex = this.currentPlayerIndex;
    newState.turnNumber = this.turnNumber;
    
    // Copy game flow state
    newState.phase = this.phase;
    newState.hostPlayerId = this.hostPlayerId;
    newState.setup = this.setup ? { ...this.setup } : null;
    
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
   * @returns {Cell}
   */
  getCell(coordinate) {
    const existing = this.board.get(coordinate.key);
    if (existing) {
      return existing;
    }
    // Create a new empty cell if it doesn't exist
    const newCell = Cell.empty(coordinate, this);
    this.board.set(coordinate.key, newCell);
    return newCell;
  }

  /**
   * Set the terrain at a coordinate
   * @param {Coordinate} coordinate
   * @param {import('../pieces/Piece.js').Piece|null} terrainPiece
   * @param {import('../pieces/Piece.js').Piece} [actingPiece] - The piece performing this action (for recording)
   */
  setTerrain(coordinate, terrainPiece, actingPiece) {
    const cell = this.getCell(coordinate);
    cell.setTerrain(terrainPiece);
    
    // Record action if acting piece is provided and terrain is being placed
    if (actingPiece && terrainPiece) {
      this.addAction({
        type: 'place_terrain',
        pieceId: actingPiece.id,
        data: {
          at: coordinate.toString()
        }
      });
    }
    
    this._updateLastModified();
  }

  /**
   * Set the piece at a coordinate
   * @param {Coordinate} coordinate
   * @param {import('../pieces/Piece.js').Piece|null} piece
   */
  setPiece(coordinate, piece) {
    const cell = this.getCell(coordinate);
    cell.setPiece(piece);
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
   * Check if there's any terrain on the board
   * @returns {boolean}
   */
  hasAnyTerrain() {
    for (const [key, cell] of this.board) {
      if (cell.terrain) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if target coordinate is adjacent to any existing terrain
   * @param {Coordinate} target - The target coordinate
   * @returns {boolean}
   */
  isAdjacentToAnyTerrain(target) {
    const adjacentCoords = target.getAllAdjacent();
    return adjacentCoords.some(coord => this.hasTerrain(coord));
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
   * @param {import('../pieces/Piece.js').Piece} [actingPiece] - The piece performing this action (for recording)
   * @returns {import('../pieces/Piece.js').Piece|null} The removed terrain piece or null
   */
  removeTerrain(coordinate, actingPiece) {
    const cell = this.getCell(coordinate);
    const terrain = cell.terrain;
    if (terrain) {
      cell.setTerrain(null);
      
      // Record action if acting piece is provided
      if (actingPiece) {
        this.addAction({
          type: 'remove_terrain',
          pieceId: actingPiece.id,
          data: {
            at: coordinate.toString()
          }
        });
      }
      
      this._updateLastModified();
    }
    return terrain;
  }

  /**
   * Move terrain from one position to another
   * @param {Coordinate} fromCoordinate - Source coordinate
   * @param {Coordinate} toCoordinate - Target coordinate
   * @param {import('../pieces/Piece.js').Piece} [actingPiece] - The piece performing this action (for recording)
   */
  moveTerrain(fromCoordinate, toCoordinate, actingPiece) {
    // Get the terrain to move (without recording action)
    const terrain = this.removeTerrain(fromCoordinate);
    
    // If target has a piece, capture it
    const targetCell = this.getCell(toCoordinate);
    if (targetCell.hasPiece() && targetCell.piece) {
      this.moveToGraveyard(targetCell.piece);
      targetCell.setPiece(null);
    }
    
    // Place the terrain at the target (without recording action)
    this.setTerrain(toCoordinate, terrain);
    
    // Record action if acting piece is provided
    if (actingPiece && terrain) {
      this.addAction({
        type: 'move_terrain',
        pieceId: actingPiece.id,
        data: {
          from: fromCoordinate.toString(),
          to: toCoordinate.toString()
        }
      });
    }
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
   * @param {import('../pieces/Piece.js').Piece} [actingPiece] - The piece performing this action (for recording)
   * @returns {{terrain: import('../pieces/Piece.js').Piece|null, piece: import('../pieces/Piece.js').Piece|null}}
   */
  removeCellContents(coordinate, actingPiece) {
    const cell = this.getCell(coordinate);
    const { terrain, piece } = cell.clear();

    // Move terrain to community pool if it exists
    if (terrain) {
      this.addToCommunityPool(terrain);
    }

    // Move piece to graveyard if it exists
    if (piece) {
      this.moveToGraveyard(piece);
    }

    // Record action if acting piece is provided and terrain was removed
    if (actingPiece && terrain) {
      this.addAction({
        type: 'remove_terrain',
        pieceId: actingPiece.id,
        data: {
          at: coordinate.toString()
        }
      });
    }

    this._updateLastModified();
    return { terrain, piece };
  }

  /**
   * Add a player to the game
   * @param {string} playerId
   * @param {string} [playerName] - Optional display name, defaults to truncated ID
   */
  addPlayer(playerId, playerName) {
    if (!this.players.includes(playerId)) {
      this.players.push(playerId);
      this.playerStashes.set(playerId, []);
      
      // Add to playerInfo array
      const name = playerName || `Player ${playerId.slice(-4)}`;
      this.playerInfo.push({ id: playerId, name });
    }
    this._updateLastModified();
  }

  /**
   * Get player info by ID
   * @param {string} playerId
   * @returns {PlayerInfo|undefined}
   */
  getPlayerInfo(playerId) {
    return this.playerInfo.find(info => info.id === playerId);
  }

  /**
   * Get player name by ID
   * @param {string} playerId
   * @returns {string}
   */
  getPlayerName(playerId) {
    const info = this.getPlayerInfo(playerId);
    return info ? info.name : `Player ${playerId.slice(-4)}`;
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

  // Action-recording convenience methods for piece actions
  // These methods combine low-level state changes with action recording

  /**
   * Place terrain and record the action (convenience method for piece actions)
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {Coordinate} coordinate - Where to place the terrain
   * @param {import('../pieces/Piece.js').Piece} terrainPiece - The terrain piece to place
   */
  recordPlaceTerrain(piece, coordinate, terrainPiece) {
    this.setTerrain(coordinate, terrainPiece, piece);
  }

  /**
   * Remove terrain and record the action (convenience method for piece actions)
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {Coordinate} coordinate - Where to remove terrain from
   * @returns {import('../pieces/Piece.js').Piece|null} The removed terrain piece
   */
  recordRemoveTerrain(piece, coordinate) {
    // Remove all contents from the target cell
    this.removeCellContents(coordinate, piece);
    
    return null; // Contents were moved to community pool/graveyard
  }

  /**
   * Move terrain from one position to another and record the action (convenience method for piece actions)
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {Coordinate} fromCoordinate - Source coordinate
   * @param {Coordinate} toCoordinate - Target coordinate
   */
  recordMoveTerrain(piece, fromCoordinate, toCoordinate) {
    this.moveTerrain(fromCoordinate, toCoordinate, piece);
  }

  /**
   * Serialize the game state to JSON
   * @returns {Object}
   */
  toJSON() {
    const boardArray = [];
    for (const [key, cell] of this.board) {
      if (cell.terrain || cell.piece) {
        boardArray.push(cell.toJSON());
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
      gameId: this.gameId,
      board: boardArray,
      players: this.players,
      playerInfo: this.playerInfo,
      currentPlayerIndex: this.currentPlayerIndex,
      turnNumber: this.turnNumber,
      playerStashes: playerStashesArray,
      communityPool: this.communityPool.map(piece => piece.toJSON()),
      graveyard: this.graveyard.map(piece => piece.toJSON()),
      actionHistory: this.actionHistory,
      createdAt: this.createdAt.toISOString(),
      lastModified: this.lastModified.toISOString(),
      phase: this.phase,
      hostPlayerId: this.hostPlayerId,
      setup: this.setup
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
    
    // Restore game ID
    state.gameId = data.gameId || null;
    
    // Restore board
    state.board = new Map();
    for (const cellData of data.board) {
      const coord = Coordinate.fromKey(cellData.coordinate);
      const terrain = cellData.terrain ? pieceFromJSON(cellData.terrain, state) : null;
      const piece = cellData.piece ? pieceFromJSON(cellData.piece, state) : null;
      const cell = new Cell(coord, terrain, piece, state);
      state.board.set(cellData.coordinate, cell);
    }
    
    // Restore other properties
    state.players = data.players;
    state.playerInfo = data.playerInfo || [];
    state.currentPlayerIndex = data.currentPlayerIndex;
    state.turnNumber = data.turnNumber;
    
    // Restore game flow state
    state.phase = /** @type {'lobby'|'land'|'citadel'|'done'} */ (data.phase || 'lobby');
    state.hostPlayerId = data.hostPlayerId || null;
    state.setup = data.setup || null;
    
    // Restore player stashes
    state.playerStashes = new Map();
    for (const { playerId, stash } of data.playerStashes) {
      state.playerStashes.set(playerId, stash.map(pieceData => pieceFromJSON(pieceData, state)));
    }
    
    state.communityPool = data.communityPool.map(pieceData => pieceFromJSON(pieceData, state));
    state.graveyard = data.graveyard.map(pieceData => pieceFromJSON(pieceData, state));
    state.actionHistory = data.actionHistory;
    state.createdAt = new Date(data.createdAt);
    state.lastModified = new Date(data.lastModified);
    
    return state;
  }
}
