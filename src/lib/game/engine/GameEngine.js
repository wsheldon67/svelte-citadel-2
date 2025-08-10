import { GameState } from './GameState.js';
import { RuleViolation } from './RuleViolation.js';
import { Coordinate } from './Coordinate.js';

/**
 * @typedef {Object} ValidAction
 * @property {import('../actions/Action.js').Action} action
 * @property {Coordinate[]} targets
 */

/**
 * @typedef {Object} PlayerActions
 * @property {import('../pieces/Piece.js').Piece} piece
 * @property {ValidAction[]} actions
 */

/**
 * The main game engine that manages game state, actions, and rule validation.
 * Implements the "copy-and-test" design for action validation.
 */
export class GameEngine {
  /**
   * @param {GameState} [initialState] - Initial game state
   */
  constructor(initialState = undefined) {
    /** @type {GameState} */
    this.gameState = initialState || new GameState();
    
    /** @type {GameState} */
    this.initialState = this.gameState.copy();
  }

  /**
   * Validate an action without applying it to the game state
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to validate
   * @param {Coordinate} target - The target coordinate
   * @returns {boolean} True if the action is valid
   */
  validateAction(piece, action, target) {
    try {
      this.checkAction(piece, action, target);
      return true;
    } catch (error) {
      if (error instanceof RuleViolation) {
        return false;
      }
      throw error; // Re-throw unexpected errors
    }
  }

  /**
   * Check if an action is valid and throw RuleViolation if not
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to check
   * @param {Coordinate} target - The target coordinate
   * @throws {RuleViolation} If the action is invalid
   */
  checkAction(piece, action, target) {
    // Create a simulation copy of the game state
    const simulationState = this.gameState.copy({ isSimulation: true });
    
    // Set up the piece in the simulation
    const simulationPiece = this._findPieceInState(piece.id, simulationState);
    if (!simulationPiece) {
      throw new RuleViolation('Piece not found on the board');
    }
    
    // Create the action instance for the simulation piece
    /** @type {typeof import('../actions/Action.js').Action} */
    const ActionClass = /** @type {any} */ (action.constructor);
    const simulationAction = new ActionClass(simulationPiece);
    
    // Check the action validity BEFORE performing it
    // Create a separate copy for the "new state" that the check method expects
    const newState = simulationState.copy({ isSimulation: true });
    const newStatePiece = this._findPieceInState(piece.id, newState);
    if (!newStatePiece) {
      throw new RuleViolation('Piece not found in new state');
    }
    const newStateAction = new ActionClass(newStatePiece);
    
    // Apply the action to the new state to simulate the result
    newStateAction.perform(target, newState);
    
    // Now check the action validity using the original and modified states
    simulationAction.check(target, simulationState, newState);
  }

  /**
   * Execute an action on the game state
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to execute
   * @param {Coordinate} target - The target coordinate
   * @throws {RuleViolation} If the action is invalid
   */
  executeAction(piece, action, target) {
    // First validate the action
    this.checkAction(piece, action, target);
    
    // If validation passes, apply the action to the real game state
    action.perform(target, this.gameState);
    
    // Update the piece's game state reference
    piece._setGameState(this.gameState);
  }

  /**
   * Get all valid actions for a piece
   * @param {import('../pieces/Piece.js').Piece} piece - The piece to get actions for
   * @returns {ValidAction[]}
   */
  getValidActionsForPiece(piece) {
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
   * Get valid targets for an action by iterating over board coordinates and testing with check()
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to get targets for
   * @returns {Coordinate[]} Array of valid target coordinates
   */
  getValidTargetsForAction(piece, action) {
    const validTargets = [];
    
    // Get board extents with a margin for pieces that can move long distances
    const extents = this.gameState.getBoardExtents();
    const margin = 3; // Reasonable margin for long-range pieces like Bird
    
    const minX = extents.minX - margin;
    const maxX = extents.maxX + margin;
    const minY = extents.minY - margin;
    const maxY = extents.maxY + margin;
    
    // Iterate over all coordinates in the extended area
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const target = new Coordinate(x, y);
        
        try {
          this.checkAction(piece, action, target);
          validTargets.push(target);
        } catch (error) {
          if (error instanceof RuleViolation) {
            // Invalid target, skip it
            continue;
          }
          throw error; // Re-throw unexpected errors
        }
      }
    }
    
    return validTargets;
  }

  /**
   * Get all valid targets for all pieces of a player
   * @param {string} playerId - The player ID
   * @returns {PlayerActions[]}
   */
  getValidActionsForPlayer(playerId) {
    const pieces = [];
    
    // Find all pieces belonging to the player
    for (const [key, cell] of this.gameState.board) {
      if (cell.piece && cell.piece.owner === playerId) {
        const coordinate = Coordinate.fromKey(key);
        // Ensure the piece has its coordinate and game state set up
        cell.piece._setCoordinate(coordinate);
        cell.piece._setGameState(this.gameState);
        
        const validActions = this.getValidActionsForPiece(cell.piece);
        if (validActions.length > 0) {
          pieces.push({
            piece: cell.piece,
            actions: validActions
          });
        }
      }
    }
    
    return pieces;
  }

  /**
   * Place a piece on the board
   * @param {import('../pieces/Piece.js').Piece} piece - The piece to place
   * @param {Coordinate} coordinate - Where to place the piece
   * @throws {RuleViolation} If the placement is invalid
   */
  placePiece(piece, coordinate) {
    // Basic placement validation
    if (this.gameState.hasPiece(coordinate)) {
      throw new RuleViolation('Cannot place piece on occupied square');
    }
    
    // Place the piece
    this.gameState.setPiece(coordinate, piece);
    piece._setCoordinate(coordinate);
    piece._setGameState(this.gameState);
    
    // Record the action
    this.gameState.addAction({
      type: 'place',
      pieceId: piece.id,
      at: coordinate.toString()
    });
  }

  /**
   * End the current player's turn
   */
  endTurn() {
    this.gameState.nextTurn();
  }

  /**
   * Get the current game state
   * @returns {GameState}
   */
  getCurrentState() {
    return this.gameState;
  }

  /**
   * Get the initial game state
   * @returns {GameState}
   */
  getInitialState() {
    return this.initialState;
  }

  /**
   * Create a new game from the initial state and a list of actions
   * This allows for replay and undo functionality
   * @param {Object[]} actions - List of actions to replay
   * @returns {GameState}
   */
  replayFromActions(actions) {
    const replayState = this.initialState.copy();
    
    // TODO: Implement action replay system
    // This would require deserializing actions and re-executing them
    
    return replayState;
  }

  /**
   * Create a simulation copy of the current game state
   * @returns {GameState}
   */
  createSimulation() {
    return this.gameState.copy({ isSimulation: true });
  }

  /**
   * Find a piece by ID in a specific game state
   * @param {string} pieceId - The piece ID to find
   * @param {GameState} gameState - The game state to search in
   * @returns {import('../pieces/Piece.js').Piece|null}
   * @private
   */
  _findPieceInState(pieceId, gameState) {
    for (const [key, cell] of gameState.board) {
      if (cell.piece && cell.piece.id === pieceId) {
        const coordinate = Coordinate.fromKey(key);
        cell.piece._setCoordinate(coordinate);
        cell.piece._setGameState(gameState);
        return cell.piece;
      }
    }
    return null;
  }

  /**
   * Check if the game has ended and determine the winner
   * @returns {{isEnded: boolean, winner: string|null, reason: string|null}}
   */
  checkGameEnd() {
    // TODO: Implement game end conditions based on Citadel rules
    // - Check if a player has lost all Citadels
    // - Check for other win conditions
    
    return {
      isEnded: false,
      winner: null,
      reason: null
    };
  }

  /**
   * Validate that Citadels remain connected
   * This is a core rule of the game
   * @param {string} playerId - The player to check
   * @returns {boolean}
   */
  validateCitadelConnectivity(playerId) {
    const citadels = this.gameState.findPieces('Citadel', playerId);
    if (citadels.length <= 1) {
      return true; // Single or no citadels are always "connected"
    }
    
    // TODO: Implement path-finding to verify all citadels are connected
    // via orthogonally adjacent land tiles
    
    return true;
  }
}
