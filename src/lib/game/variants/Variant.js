/**
 * Simple variant interface to keep win conditions pluggable and easy to author.
 * Entry-level developers can implement a variant by exporting an object with:
 * - id: string unique key
 * - name: human-readable name
 * - checkEnd(gameState): returns { isEnded, winner, reason } based only on state
 * - onAction?(action, gameState): optional hook after an action is recorded
 * - availablePieces?/getAvailablePieces?: class-based allowlist of constructors
 * - isPieceInstanceAllowed?: custom instance filter
 * - piecePalette?/getPiecePalette?: optional descriptors with factories for UIs
 */
export class Variant {
  /**
   * @param {{ id: string, name: string, checkEnd: Function, onAction?: Function, availablePieces?: Array<new (...args: any[]) => import('../pieces/Piece.js').Piece>, getAvailablePieces?: (gameState: import('../engine/GameState.js').GameState) => Array<new (...args: any[]) => import('../pieces/Piece.js').Piece>, isPieceInstanceAllowed?: (piece: import('../pieces/Piece.js').Piece, gameState: import('../engine/GameState.js').GameState) => boolean, piecePalette?: VariantPieceDescriptor[], getPiecePalette?: (gameState: import('../engine/GameState.js').GameState) => VariantPieceDescriptor[] }} cfg
   */
  constructor(cfg) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.checkEnd = cfg.checkEnd;
    this.onAction = cfg.onAction;
    // Availability (class-based)
    this.availablePieces = cfg.availablePieces;
    this.getAvailablePieces = cfg.getAvailablePieces;
   this._isPieceInstanceAllowed = cfg.isPieceInstanceAllowed;
  // Palette (factory-based list for UI/build)
  this.piecePalette = cfg.piecePalette;
  this.getPiecePalette = cfg.getPiecePalette;
  }

  /**
   * List piece constructors available to players in this variant.
   * @param {import('../engine/GameState.js').GameState} gameState
   * @returns {Array<new (...args: any[]) => import('../pieces/Piece.js').Piece>}
   */
  listAvailablePieces(gameState) {
    if (this.getAvailablePieces) return this.getAvailablePieces(gameState);
    if (this.availablePieces) return this.availablePieces;
    return [];
  }

  /**
   * Is a specific piece instance allowed?
   * @param {import('../pieces/Piece.js').Piece} piece
   * @param {import('../engine/GameState.js').GameState} gameState
   */
  isPieceInstanceAllowed(piece, gameState) {
    if (this._isPieceInstanceAllowed) return this._isPieceInstanceAllowed(piece, gameState);
    const ctors = this.listAvailablePieces(gameState);
    return ctors.length === 0 || ctors.some(C => piece instanceof C);
  }

  /**
   * List variant-provided piece descriptors (with factories) for UIs/builders.
   * Falls back to classes/types if explicit palette not provided.
   * @param {import('../engine/GameState.js').GameState} gameState
   * @returns {VariantPieceDescriptor[]}
   */
  listPiecePalette(gameState) {
    if (this.getPiecePalette) return this.getPiecePalette(gameState);
    if (this.piecePalette) return this.piecePalette;
  const ctors = this.listAvailablePieces(gameState);
    if (ctors.length) {
      return ctors.map((Ctor) => ({ key: Ctor.name, label: Ctor.name, create: (owner) => new Ctor({ owner }) }));
    }
  // Default empty palette
  return [];
  }
}

/**
 * @typedef {Object} VariantPieceDescriptor
 * @property {string} key - unique palette key
 * @property {string} label - human-friendly label
 * @property {(owner: string) => import('../pieces/Piece.js').Piece | null} create - factory or null if not provided
 */

/**
 * Helper: get remaining citadels per player.
 * @param {import('../engine/GameState.js').GameState} gameState
 * @returns {Map<string, number>}
 */
export function countCitadelsByPlayer(gameState) {
  const counts = new Map();
  for (const player of gameState.players) counts.set(player, 0);
  for (const coord of gameState.getAllPieceCoordinates()) {
    const piece = gameState.getPieceAt(coord);
    if (piece && piece.type === 'Citadel') {
      counts.set(piece.owner, (counts.get(piece.owner) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Helper: players who still have at least one citadel.
 * @param {import('../engine/GameState.js').GameState} gameState
 * @returns {string[]}
 */
export function playersWithCitadels(gameState) {
  const counts = countCitadelsByPlayer(gameState);
  return [...counts.entries()].filter(([, n]) => n > 0).map(([p]) => p);
}

/**
 * Helper: has a player lost all citadels?
 * @param {import('../engine/GameState.js').GameState} gameState
 * @param {string} playerId
 */
export function hasNoCitadel(gameState, playerId) {
  const counts = countCitadelsByPlayer(gameState);
  return (counts.get(playerId) || 0) === 0;
}
