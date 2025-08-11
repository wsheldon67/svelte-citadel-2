import { GameState } from './GameState.js';
import { PersistentGameState } from './PersistentGameState.js';
import { Coordinate } from './Coordinate.js';

/**
 * @typedef {Object} ReplayOptions
 * @property {Function} pieceFromJSON - Function to recreate pieces from JSON
 * @property {boolean} [isSimulation] - Whether this is for simulation
 */

/**
 * Handles replaying actions from a PersistentGameState to build a full GameState.
 * This is the core mechanism that ensures all game state is derived from initial config + actions.
 */
export class GameStateReplay {
  /**
   * Rebuild a full GameState from a PersistentGameState by replaying all actions
   * @param {PersistentGameState} persistentState
   * @param {ReplayOptions} options
   * @returns {GameState}
   */
  static replayToFullState(persistentState, options) {
    const { pieceFromJSON, isSimulation = false } = options;
    
    // Create a new GameState with initial configuration
    const gameState = new GameState({ isSimulation });
    
    // Apply initial configuration
    GameStateReplay._applyInitialConfiguration(gameState, persistentState.initial, pieceFromJSON);
    
    // Replay all actions in order
    for (const action of persistentState.actions) {
      GameStateReplay._replayAction(gameState, action, pieceFromJSON);
    }
    
    return gameState;
  }

  /**
   * Apply initial configuration to a GameState
   * @param {GameState} gameState
   * @param {import('./PersistentGameState.js').InitialConfiguration} initial
   * @param {Function} pieceFromJSON
   * @private
   */
  static _applyInitialConfiguration(gameState, initial, pieceFromJSON) {
    // Basic properties
    gameState.gameId = initial.gameId;
    gameState.phase = initial.phase;
    gameState.hostPlayerId = initial.hostPlayerId;
    gameState.setup = initial.setup ? { ...initial.setup } : null;
    gameState.createdAt = new Date(initial.createdAt);
    
    // Players
    gameState.players = [...initial.players];
    gameState.playerInfo = initial.playerInfo.map(info => ({ ...info }));
    
    // Initialize player stashes
    for (const playerId of initial.players) {
      gameState.playerStashes.set(playerId, []);
    }
    
    // Initial pieces (usually community pool)
    gameState.communityPool = initial.initialPieces.map(pieceData => {
      const piece = pieceFromJSON(pieceData);
      piece._setGameState(gameState);
      return piece;
    });
  }

  /**
   * Replay a single action
   * @param {GameState} gameState
   * @param {import('./PersistentGameState.js').GameAction} action
   * @param {Function} pieceFromJSON
   * @private
   */
  static _replayAction(gameState, action, pieceFromJSON) {
    // Find the piece performing the action
    const piece = GameStateReplay._findOrCreatePiece(gameState, action.pieceId, action, pieceFromJSON);
    if (!piece && action.type !== 'end_turn') {
      console.warn(`Could not find or create piece ${action.pieceId} for action ${action.type}`);
      return;
    }

    // Set the correct turn context for the action
    const originalPlayerIndex = gameState.currentPlayerIndex;
    const originalTurnNumber = gameState.turnNumber;
    
    // Find player index for this action
    const playerIndex = gameState.players.indexOf(action.player);
    if (playerIndex >= 0) {
      gameState.currentPlayerIndex = playerIndex;
    }
    gameState.turnNumber = action.turnNumber;

    try {
      switch (action.type) {
        case 'place':
          if (piece) GameStateReplay._replayPlaceAction(gameState, piece, action);
          break;
        case 'move':
          if (piece) GameStateReplay._replayMoveAction(gameState, piece, action, pieceFromJSON);
          break;
        case 'move_terrain':
          if (piece) GameStateReplay._replayMoveTerrainAction(gameState, piece, action);
          break;
        case 'remove_terrain':
          if (piece) GameStateReplay._replayRemoveTerrainAction(gameState, piece, action);
          break;
        case 'place_terrain':
          if (piece) GameStateReplay._replayPlaceTerrainAction(gameState, piece, action, pieceFromJSON);
          break;
        case 'end_turn':
          gameState.nextTurn();
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error replaying action ${action.type}:`, error);
    }

    // Add the action to history (without calling addAction which would modify timestamps)
    gameState.actionHistory.push(action);
    
    // Update last modified time
    gameState.lastModified = new Date(action.timestamp);
  }

  /**
   * Replay a place action
   * @param {GameState} gameState
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('./PersistentGameState.js').GameAction} action
   * @private
   */
  static _replayPlaceAction(gameState, piece, action) {
    /** @type {import('./PersistentGameState.js').PlaceActionData} */
    const data = /** @type {any} */ (action.data);
    const coordinateStr = data.at.replace(/[()]/g, '').replace(/\s/g, '');
    const coordinate = Coordinate.fromKey(coordinateStr);
    
    // Create a copy of the piece for placement
    const placedPiece = piece.copy();
    placedPiece._setCoordinate(coordinate);
    placedPiece._setGameState(gameState);
    
    if (piece.type === 'Land') {
      gameState.setTerrain(coordinate, placedPiece);
    } else {
      gameState.setPiece(coordinate, placedPiece);
    }
  }

  /**
   * Replay a move action
   * @param {GameState} gameState
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('./PersistentGameState.js').GameAction} action
   * @param {Function} pieceFromJSON
   * @private
   */
  static _replayMoveAction(gameState, piece, action, pieceFromJSON) {
    /** @type {import('./PersistentGameState.js').MoveActionData} */
    const data = /** @type {any} */ (action.data);
    const fromCoord = Coordinate.fromKey(data.from.replace(/[()]/g, '').replace(' ', ''));
    const toCoord = Coordinate.fromKey(data.to.replace(/[()]/g, '').replace(' ', ''));
    
    // Remove piece from current position
    gameState.setPiece(fromCoord, null);
    
    // Handle captured piece if any
    if (data.captured) {
      const targetCell = gameState.getCell(toCoord);
      if (targetCell.piece) {
        gameState.moveToGraveyard(targetCell.piece);
      }
    }
    
    // Place piece at target position
    gameState.setPiece(toCoord, piece);
    piece._setCoordinate(toCoord);
  }

  /**
   * Replay a move terrain action (Builder)
   * @param {GameState} gameState
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('./PersistentGameState.js').GameAction} action
   * @private
   */
  static _replayMoveTerrainAction(gameState, piece, action) {
    /** @type {import('./PersistentGameState.js').MoveTerrainActionData} */
    const data = /** @type {any} */ (action.data);
    const fromCoord = Coordinate.fromKey(data.from.replace(/[()]/g, '').replace(' ', ''));
    const toCoord = Coordinate.fromKey(data.to.replace(/[()]/g, '').replace(' ', ''));
    
    // Get the terrain to move
    const terrain = gameState.removeTerrain(fromCoord);
    
    // Handle pieces on source terrain
    const sourceCell = gameState.getCell(fromCoord);
    if (sourceCell.piece) {
      gameState.moveToGraveyard(sourceCell.piece);
      sourceCell.setPiece(null);
    }
    
    // Handle pieces on target
    const targetCell = gameState.getCell(toCoord);
    if (targetCell.piece) {
      gameState.moveToGraveyard(targetCell.piece);
      targetCell.setPiece(null);
    }
    
    // Move terrain
    if (terrain) {
      gameState.setTerrain(toCoord, terrain);
    }
  }

  /**
   * Replay a remove terrain action (Builder)
   * @param {GameState} gameState
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('./PersistentGameState.js').GameAction} action
   * @private
   */
  static _replayRemoveTerrainAction(gameState, piece, action) {
    /** @type {import('./PersistentGameState.js').RemoveTerrainActionData} */
    const data = /** @type {any} */ (action.data);
    const coordinate = Coordinate.fromKey(data.at.replace(/[()]/g, '').replace(' ', ''));
    gameState.removeCellContents(coordinate);
  }

  /**
   * Replay a place terrain action (Builder)
   * @param {GameState} gameState
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('./PersistentGameState.js').GameAction} action
   * @param {Function} pieceFromJSON
   * @private
   */
  static _replayPlaceTerrainAction(gameState, piece, action, pieceFromJSON) {
    /** @type {import('./PersistentGameState.js').PlaceTerrainActionData} */
    const data = /** @type {any} */ (action.data);
    const coordinate = Coordinate.fromKey(data.at.replace(/[()]/g, '').replace(' ', ''));
    const landPiece = gameState.getLandFromCommunityPool();
    
    if (landPiece) {
      gameState.setTerrain(coordinate, landPiece);
      landPiece._setCoordinate(coordinate);
    }
  }

  /**
   * Find a piece by ID in the game state, or create it from the action data if not found
   * @param {GameState} gameState
   * @param {string} pieceId
   * @param {import('./PersistentGameState.js').GameAction} action
   * @param {Function} pieceFromJSON
   * @returns {import('../pieces/Piece.js').Piece|null}
   * @private
   */
  static _findOrCreatePiece(gameState, pieceId, action, pieceFromJSON) {
    // First try to find the piece in the game state
    let piece = GameStateReplay._findPieceById(gameState, pieceId);
    
    if (!piece && action.type === 'place') {
      // For place actions, we might need to create the piece from the action context
      // This handles cases where a piece is placed from a stash that wasn't properly initialized
      
      // Try to infer piece data from the ID and action
      // This is a fallback - ideally all pieces should be in initial state
      console.warn(`Creating piece ${pieceId} during replay - this suggests incomplete initial state`);
      
      // For now, create a basic land piece if it's a land placement
      if (pieceId.includes('land')) {
        const data = /** @type {any} */ (action.data);
        piece = pieceFromJSON({
          id: pieceId,
          type: 'Land',
          owner: action.player || 'neutral'
        });
        if (piece) {
          piece._setGameState(gameState);
        }
      }
    }
    
    return piece;
  }

  /**
   * Find a piece by ID in the game state
   * @param {GameState} gameState
   * @param {string} pieceId
   * @returns {import('../pieces/Piece.js').Piece|null}
   * @private
   */
  static _findPieceById(gameState, pieceId) {
    // Check board pieces
    for (const [key, cell] of gameState.board) {
      if (cell.piece?.id === pieceId) return cell.piece;
      if (cell.terrain?.id === pieceId) return cell.terrain;
    }
    
    // Check player stashes
    for (const [playerId, stash] of gameState.playerStashes) {
      const piece = stash.find(p => p.id === pieceId);
      if (piece) return piece;
    }
    
    // Check community pool
    const communityPiece = gameState.communityPool.find(p => p.id === pieceId);
    if (communityPiece) return communityPiece;
    
    // Check graveyard
    const graveyardPiece = gameState.graveyard.find(p => p.id === pieceId);
    if (graveyardPiece) return graveyardPiece;
    
    return null;
  }
}
