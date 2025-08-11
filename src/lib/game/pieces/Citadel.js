import { Piece } from './Piece.js';

// Minimal Citadel piece so variants can detect them. No actions by default.
export class Citadel extends Piece {
  /** @param {Omit<import('./Piece.js').PieceOptions, 'type'>} options */
  constructor(options) {
    super({ ...options, type: 'Citadel' });
  }
}
