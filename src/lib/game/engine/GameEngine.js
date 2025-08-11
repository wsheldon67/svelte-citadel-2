import { GameState } from './GameState.js';
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
 * The main game engine that manages game state, actions, and rule validation.
 * Implements the "copy-and-test" design for action validation.
 */
export class GameEngine {
  /**
   * @param {GameState} [initialState] - Initial game state
   * @param {import('../variants/Variant.js').Variant} [variant] - Game variant (win condition)
   */
  constructor(initialState = undefined, variant = undefined) {
    /** @type {GameState} */
    this.gameState = initialState || new GameState();
    
    /** @type {GameState} */
    this.initialState = this.gameState.copy();

    /** @type {import('../variants/Variant.js').Variant | null} */
    this.variant = variant || null;
  }

  /**
   * Validate an action without applying it to the game state
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to validate
   * @param {import('./Cell.js').Cell} targetCell - The target cell
   * @returns {boolean} True if the action is valid
   */
  validateAction(piece, action, targetCell) {
    try {
      this.checkAction(piece, action, targetCell);
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
   * @param {import('./Cell.js').Cell} targetCell - The target cell
   * @throws {RuleViolation} If the action is invalid
   */
  checkAction(piece, action, targetCell) {
    // Create a simulation copy of the game state
    const simulationState = this.gameState.copy({ isSimulation: true });
    
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
    
    // Check the action validity BEFORE performing it
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
   * Execute an action on the game state
   * @param {import('../pieces/Piece.js').Piece} piece - The piece performing the action
   * @param {import('../actions/Action.js').Action} action - The action to execute
   * @param {import('./Cell.js').Cell} targetCell - The target cell
   * @throws {RuleViolation} If the action is invalid
   */
  executeAction(piece, action, targetCell) {
    // First validate the action
    this.checkAction(piece, action, targetCell);
    
    // If validation passes, apply the action to the real game state
    action.perform(targetCell, this.gameState);
    
    // Update the piece's game state reference
    piece._setGameState(this.gameState);

    // Variant post-action hook
    if (this.variant?.onAction) {
      const last = this.gameState.actionHistory[this.gameState.actionHistory.length - 1];
      try { this.variant.onAction(last, this.gameState); } catch {}
    }
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
   * @returns {import('./Cell.js').Cell[]} Array of valid target cells
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
        const coord = new Coordinate(x, y);
        const targetCell = this.gameState.getCell(coord);
        
        try {
          this.checkAction(piece, action, targetCell);
          validTargets.push(targetCell);
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
    // Variant restriction: piece availability (class-based only)
    if (this.variant) {
      const ctors = this.variant.listAvailablePieces(this.gameState);
      if (ctors.length > 0 && !this.variant.isPieceInstanceAllowed(piece, this.gameState)) {
        throw new RuleViolation(`Piece '${piece.type}' is not allowed in variant '${this.variant.name}'`);
      }
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

    // Variant post-action hook
    if (this.variant?.onAction) {
      const last = this.gameState.actionHistory[this.gameState.actionHistory.length - 1];
      try { this.variant.onAction(last, this.gameState); } catch {}
    }
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
   * Set or change the active game variant (win condition module)
   * @param {import('../variants/Variant.js').Variant|null} variant
   */
  setVariant(variant) {
    this.variant = variant || null;
  }

  /**
   * Get piece types available in current variant (empty means "no restriction").
   * @returns {string[]}
   */
  /**
   * Get piece classes available in current variant.
   * @returns {Array<new (...args: any[]) => import('../pieces/Piece.js').Piece>}
   */
  getAvailablePieceClasses() {
    if (!this.variant) return [];
    return this.variant.listAvailablePieces(this.gameState);
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
    if (this.variant) {
      return this.variant.checkEnd(this.gameState);
    }
    return { isEnded: false, winner: null, reason: null };
  }

  /**
   * Validate that Citadels remain connected
   * This is a core rule of the game
   * Checks all citadels across all players are connected via orthogonally adjacent terrain (Land/Turtle)
   * @returns {boolean} true when 0-1 citadels or all are connected
   */
  validateCitadelConnectivity() {
    // Gather all citadels regardless of owner
    const citadels = [];
    for (const { coordinate, piece } of this._iterAllPieces()) {
      if (piece.type === 'Citadel') citadels.push(coordinate);
    }
    if (citadels.length <= 1) return true;

    // BFS from the first citadel across passable terrain (any terrain counts as passable; Turtle acts as Land for this rule)
    const start = citadels[0];
    const visited = new Set([start.key]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      if (!cur) break;
      for (const n of cur.getOrthogonalAdjacent()) {
        if (visited.has(n.key)) continue;
        if (!this.gameState.hasTerrain(n)) continue; // only traverse terrain tiles
        visited.add(n.key);
        queue.push(n);
      }
    }

    // All citadels must be on visited terrain
    return citadels.every((c) => visited.has(c.key));
  }

  /** @returns {Iterable<{coordinate: Coordinate, piece: import('../pieces/Piece.js').Piece}>} */
  *_iterAllPieces() {
    for (const [key, cell] of this.gameState.board) {
      if (cell.piece) {
        yield { coordinate: Coordinate.fromKey(key), piece: cell.piece };
      }
    }
  }
}
