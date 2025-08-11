import { GameState } from './GameState.js';
import { PersistentGameState } from './PersistentGameState.js';
import { GameStateReplay } from './GameStateReplay.js';
import { RuleViolation } from './RuleViolation.js';
import { Coordinate } from './Coordinate.js';

/**
 * @typedef {Object} ValidAction
 * @property {import('../actions/Action.js').Action} action
 * @property {import('./Cell.js').Cell[]} targets
 */

/**
 * @typedef {Object} PlayerActions
 * @property {import('../pieces/Piece.js').Piece} piece
 * @property {ValidAction[]} actions
 */

/**
 * Enhanced game engine that uses the new persistent state design.
 * Maintains only initial configuration + actions, with full state derived via replay.
 */
export class GameEngine2 {
  /**
   * @param {Function} pieceFromJSON - Function to recreate pieces from JSON
   * @param {PersistentGameState} [persistentState] - Persistent game state
   * @param {import('../variants/Variant.js').Variant} [variant] - Game variant
   */
  constructor(pieceFromJSON, persistentState = undefined, variant = undefined) {
    /** @type {PersistentGameState} */
    this.persistentState = persistentState || new PersistentGameState();
    
    /** @type {import('../variants/Variant.js').Variant | null} */
    this.variant = variant || null;

    /** @type {Function} */
    this.pieceFromJSON = pieceFromJSON;

    /** @type {GameState|null} */
    this._cachedCurrentState = null;
  }

  /**
   * Get the current game state (derived from persistent state)
   * @returns {GameState}
   */
  getCurrentState() {
    if (!this._cachedCurrentState) {
      this._cachedCurrentState = GameStateReplay.replayToFullState(
        this.persistentState,
        { pieceFromJSON: this.pieceFromJSON }
      );
    }
    return this._cachedCurrentState;
  }

  /**
   * Invalidate the cached state (call after making changes to persistent state)
   * @private
   */
  _invalidateCache() {
    this._cachedCurrentState = null;
  }

  /**
   * Get the persistent state (for serialization)
   * @returns {PersistentGameState}
   */
  getPersistentState() {
    return this.persistentState;
  }

  /**
   * Update initial configuration
   * @param {Partial<import('./PersistentGameState.js').InitialConfiguration>} updates
   */
  updateInitialConfig(updates) {
    this.persistentState.updateInitial(updates);
    this._invalidateCache();
  }

  /**
   * Add a player to the game
   * @param {string} playerId
   * @param {string} [playerName]
   */
  addPlayer(playerId, playerName) {
    this.persistentState.addPlayer(playerId, playerName);
    this._invalidateCache();
  }

  /**
   * Set the host player
   * @param {string} playerId
   */
  setHost(playerId) {
    this.persistentState.setHost(playerId);
    this._invalidateCache();
  }

  /**
   * Set the game phase
   * @param {'lobby'|'land'|'citadel'|'done'} phase
   */
  setPhase(phase) {
    this.persistentState.setPhase(phase);
    this._invalidateCache();
  }

  /**
   * Set game setup
   * @param {Object} setup
   */
  setSetup(setup) {
    this.persistentState.setSetup(setup);
    this._invalidateCache();
  }

  /**
   * Set game ID
   * @param {string} gameId
   */
  setGameId(gameId) {
    this.persistentState.setGameId(gameId);
    this._invalidateCache();
  }

  /**
   * Validate an action without applying it
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../actions/Action.js').Action} action
   * @param {import('./Cell.js').Cell} targetCell
   * @returns {boolean}
   */
  validateAction(piece, action, targetCell) {
    try {
      this.checkAction(piece, action, targetCell);
      return true;
    } catch (error) {
      if (error instanceof RuleViolation) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if an action is valid and throw RuleViolation if not
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../actions/Action.js').Action} action
   * @param {import('./Cell.js').Cell} targetCell
   * @throws {RuleViolation} If the action is invalid
   */
  checkAction(piece, action, targetCell) {
    // Get current state for validation
    const currentState = this.getCurrentState();
    
    // Create a simulation copy 
    const simulationState = currentState.copy({ isSimulation: true });
    
    // Set up the piece in the simulation
    const simulationPiece = this._findPieceInState(piece.id, simulationState);
    if (!simulationPiece) {
      throw new RuleViolation('Piece not found on the board');
    }

    // Get the corresponding cell in the simulation state
    const simulationTargetCell = simulationState.getCell(targetCell.coordinate);
    
    // Create the action instance for the simulation piece
    /** @type {typeof import('../actions/Action.js').Action} */
    const ActionClass = /** @type {any} */ (action.constructor);
    const simulationAction = new ActionClass(simulationPiece);
    
    // Create a separate copy for the "new state" that the check method expects
    const newState = simulationState.copy({ isSimulation: true });
    const newStatePiece = this._findPieceInState(piece.id, newState);
    if (!newStatePiece) {
      throw new RuleViolation('Piece not found in new state');
    }
    const newStateAction = new ActionClass(newStatePiece);
    const newStateTargetCell = newState.getCell(targetCell.coordinate);
    
    // Apply the action to the new state to simulate the result
    newStateAction.perform(newStateTargetCell, newState);
    
    // Now check the action validity using the original and modified states
    simulationAction.check(simulationTargetCell, simulationState, newState);
  }

  /**
   * Execute an action
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../actions/Action.js').Action} action
   * @param {import('./Cell.js').Cell} targetCell
   * @throws {RuleViolation} If the action is invalid
   */
  executeAction(piece, action, targetCell) {
    // First validate the action
    this.checkAction(piece, action, targetCell);
    
    // Get current state to execute action on
    const gameState = this.getCurrentState();
    
    // Apply the action to the game state (which will record itself in actionHistory)
    action.perform(targetCell, gameState);
    
    // Extract the recorded action from the temporary gameState and add to persistent state
    const recordedAction = gameState.actionHistory[gameState.actionHistory.length - 1];
    if (recordedAction) {
      this.persistentState.addAction({
        type: /** @type {any} */ (recordedAction).type || /** @type {any} */ (recordedAction).name,
        pieceId: /** @type {any} */ (recordedAction).pieceId || piece.id,
        data: /** @type {any} */ (recordedAction).data || /** @type {any} */ (recordedAction),
        turnNumber: /** @type {any} */ (recordedAction).turnNumber || gameState.turnNumber,
        player: /** @type {any} */ (recordedAction).player || gameState.currentPlayer
      });
    }
    
    // Invalidate cache so next getCurrentState() will replay from persistent state
    this._invalidateCache();

    // Variant post-action hook
    if (this.variant?.onAction) {
      const lastAction = this.persistentState.getLastAction();
      if (lastAction) {
        try { 
          const newCurrentState = this.getCurrentState();
          this.variant.onAction(lastAction, newCurrentState); 
        } catch {}
      }
    }

    // Update Firestore if needed
    if (this.persistentState.getGameId()) {
      this._updateFirestore().catch(console.error);
    }
  }

  /**
   * Execute an action and wait for Firestore update
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../actions/Action.js').Action} action
   * @param {import('./Cell.js').Cell} targetCell
   * @throws {RuleViolation} If the action is invalid
   */
  async executeActionAsync(piece, action, targetCell) {
    this.executeAction(piece, action, targetCell);
    
    // Wait for Firestore update if needed
    if (this.persistentState.getGameId()) {
      await this._updateFirestore();
    }
  }

  /**
   * Update Firestore with current persistent state
   * @private
   */
  async _updateFirestore() {
    // This would integrate with Firebase - implementation depends on your Firebase setup
    // For now, just log what would be saved
    console.log('Would save to Firestore:', this.persistentState.toJSON());
  }

  /**
   * Get all valid actions for a piece
   * @param {import('../pieces/Piece.js').Piece} piece
   * @returns {ValidAction[]}
   */
  getValidActionsForPiece(piece) {
    const currentState = this.getCurrentState();
    
    if (!piece.coordinate) {
      return [];
    }

    const actions = piece.getActions();
    const validActions = [];

    for (const ActionClass of actions) {
      /** @type {typeof import('../actions/Action.js').Action} */
      const TypedActionClass = /** @type {any} */ (ActionClass);
      const action = new TypedActionClass(piece);
      
      // Generate potential targets by iterating over board extents plus margin
      const validTargets = this.getValidTargetsForAction(piece, action);

      if (validTargets.length > 0) {
        validActions.push({
          action,
          targets: validTargets
        });
      }
    }

    return validActions;
  }

  /**
   * Get valid targets for an action
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../actions/Action.js').Action} action
   * @returns {import('./Cell.js').Cell[]}
   */
  getValidTargetsForAction(piece, action) {
    const currentState = this.getCurrentState();
    const validTargets = [];
    
    // Get board extents with a margin for pieces that can move long distances
    const extents = currentState.getBoardExtents();
    const margin = 5; // Allow pieces to move beyond current board
    
    for (let x = extents.minX - margin; x <= extents.maxX + margin; x++) {
      for (let y = extents.minY - margin; y <= extents.maxY + margin; y++) {
        const coord = new Coordinate(x, y);
        const cell = currentState.getCell(coord);
        
        try {
          this.checkAction(piece, action, cell);
          validTargets.push(cell);
        } catch (error) {
          // Action is not valid for this target, skip it
        }
      }
    }

    return validTargets;
  }

  /**
   * End the current player's turn
   */
  endTurn() {
    const currentState = this.getCurrentState();
    
    // Record the end turn action
    this.persistentState.addAction({
      type: 'end_turn',
      pieceId: '', // No specific piece for end turn
      data: /** @type {any} */ ({}),
      turnNumber: currentState.turnNumber,
      player: currentState.currentPlayer
    });
    
    this._invalidateCache();
  }

  /**
   * Find a piece by ID in a game state
   * @param {string} pieceId
   * @param {GameState} gameState
   * @returns {import('../pieces/Piece.js').Piece|null}
   * @private
   */
  _findPieceInState(pieceId, gameState) {
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

  /**
   * Create from persistent state JSON
   * @param {import('./PersistentGameState.js').PersistentGameStateJSON} data
   * @param {Function} pieceFromJSON
   * @param {import('../variants/Variant.js').Variant} [variant]
   * @returns {GameEngine2}
   */
  static fromJSON(data, pieceFromJSON, variant) {
    const persistentState = PersistentGameState.fromJSON(data);
    return new GameEngine2(pieceFromJSON, persistentState, variant);
  }

  /**
   * Serialize to JSON (only persistent data)
   * @returns {import('./PersistentGameState.js').PersistentGameStateJSON}
   */
  toJSON() {
    return this.persistentState.toJSON();
  }
}
