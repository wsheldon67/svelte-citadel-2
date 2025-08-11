/**
 * @typedef {Object} InitialConfiguration
 * @property {string|null} gameId - The game identifier for Firestore
 * @property {string[]} players - Array of player identifiers
 * @property {PlayerInfo[]} playerInfo - Array of player info objects with id and name
 * @property {string} createdAt - ISO timestamp when game state was created
 * @property {'lobby'|'land'|'citadel'|'done'} phase - Initial game phase
 * @property {string|null} hostPlayerId - ID of the player who is the host
 * @property {Object|null} setup - Game setup configuration
 * @property {import('../pieces/Piece.js').PieceJSON[]} initialPieces - Initial pieces (usually community pool)
 */

/**
 * @typedef {Object} GameAction
 * @property {string} type - The action type (e.g., 'place', 'move', 'remove')
 * @property {string} pieceId - ID of the piece performing the action
 * @property {ActionData} data - Action-specific data
 * @property {string} timestamp - ISO timestamp when action was recorded
 * @property {number} turnNumber - Turn number when action was performed
 * @property {string} player - Player who performed the action
 */

/**
 * @typedef {PlaceActionData|MoveActionData|MoveTerrainActionData|RemoveTerrainActionData|PlaceTerrainActionData} ActionData
 */

/**
 * @typedef {Object} PlaceActionData
 * @property {string} at - Coordinate string where piece was placed
 */

/**
 * @typedef {Object} MoveActionData
 * @property {string} from - Source coordinate string
 * @property {string} to - Target coordinate string
 * @property {string|null} captured - ID of captured piece if any
 * @property {string|null} capturedType - Type of captured piece if any
 * @property {string|null} capturedOwner - Owner of captured piece if any
 */

/**
 * @typedef {Object} MoveTerrainActionData
 * @property {string} from - Source coordinate string
 * @property {string} to - Target coordinate string
 */

/**
 * @typedef {Object} RemoveTerrainActionData
 * @property {string} at - Coordinate string where terrain was removed
 */

/**
 * @typedef {Object} PlaceTerrainActionData
 * @property {string} at - Coordinate string where terrain was placed
 */

/**
 * @typedef {Object} PlayerInfo
 * @property {string} id - The player identifier
 * @property {string} name - The player display name
 */

/**
 * @typedef {Object} PersistentGameStateJSON
 * @property {InitialConfiguration} initial - The initial game configuration
 * @property {GameAction[]} actions - Array of actions performed
 * @property {string} lastModified - ISO timestamp when game state was last modified
 */

/**
 * Represents only the persistent data needed to reconstruct a game state.
 * Contains initial configuration and action history only.
 * All other game state should be derived from this data.
 */
export class PersistentGameState {
  /**
   * @param {InitialConfiguration} [initialConfig]
   */
  constructor(initialConfig) {
    /** @type {InitialConfiguration} */
    this.initial = initialConfig || {
      gameId: null,
      players: [],
      playerInfo: [],
      createdAt: new Date().toISOString(),
      phase: 'lobby',
      hostPlayerId: null,
      setup: null,
      initialPieces: []
    };

    /** @type {GameAction[]} */
    this.actions = [];

    /** @type {string} */
    this.lastModified = new Date().toISOString();
  }

  /**
   * Add an action to the history
   * @param {Omit<GameAction, 'timestamp'>} action
   */
  addAction(action) {
    this.actions.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    this.lastModified = new Date().toISOString();
  }

  /**
   * Get the last action performed
   * @returns {GameAction|null}
   */
  getLastAction() {
    return this.actions.length > 0 ? this.actions[this.actions.length - 1] : null;
  }

  /**
   * Create a deep copy of the persistent state
   * @returns {PersistentGameState}
   */
  copy() {
    const newState = new PersistentGameState();
    newState.initial = JSON.parse(JSON.stringify(this.initial));
    newState.actions = JSON.parse(JSON.stringify(this.actions));
    newState.lastModified = this.lastModified;
    return newState;
  }

  /**
   * Serialize to JSON for storage/transmission
   * @returns {PersistentGameStateJSON}
   */
  toJSON() {
    return {
      initial: this.initial,
      actions: this.actions,
      lastModified: this.lastModified
    };
  }

  /**
   * Create from JSON data
   * @param {PersistentGameStateJSON} data
   * @returns {PersistentGameState}
   */
  static fromJSON(data) {
    const state = new PersistentGameState(data.initial);
    state.actions = data.actions || [];
    state.lastModified = data.lastModified || new Date().toISOString();
    return state;
  }

  /**
   * Update initial configuration
   * @param {Partial<InitialConfiguration>} updates
   */
  updateInitial(updates) {
    this.initial = { ...this.initial, ...updates };
    this.lastModified = new Date().toISOString();
  }

  /**
   * Get game ID
   * @returns {string|null}
   */
  getGameId() {
    return this.initial.gameId;
  }

  /**
   * Set game ID
   * @param {string} gameId
   */
  setGameId(gameId) {
    this.initial.gameId = gameId;
    this.lastModified = new Date().toISOString();
  }

  /**
   * Get players
   * @returns {string[]}
   */
  getPlayers() {
    return [...this.initial.players];
  }

  /**
   * Add a player
   * @param {string} playerId
   * @param {string} [playerName]
   */
  addPlayer(playerId, playerName) {
    if (!this.initial.players.includes(playerId)) {
      this.initial.players.push(playerId);
      const name = playerName || `Player ${playerId.slice(-4)}`;
      this.initial.playerInfo.push({ id: playerId, name });
      this.lastModified = new Date().toISOString();
    }
  }

  /**
   * Get player info
   * @param {string} playerId
   * @returns {PlayerInfo|undefined}
   */
  getPlayerInfo(playerId) {
    return this.initial.playerInfo.find(info => info.id === playerId);
  }

  /**
   * Set host player
   * @param {string} playerId
   */
  setHost(playerId) {
    this.initial.hostPlayerId = playerId;
    this.lastModified = new Date().toISOString();
  }

  /**
   * Set game phase
   * @param {'lobby'|'land'|'citadel'|'done'} phase
   */
  setPhase(phase) {
    this.initial.phase = phase;
    this.lastModified = new Date().toISOString();
  }

  /**
   * Set game setup
   * @param {Object} setup
   */
  setSetup(setup) {
    this.initial.setup = setup;
    this.lastModified = new Date().toISOString();
  }
}
