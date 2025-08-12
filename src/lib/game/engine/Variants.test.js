import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { GameState } from './GameState.js';
import { Coordinate } from './Coordinate.js';
import { Piece } from '../pieces/Piece.js';
import { Citadel } from '../pieces/Citadel.js';
import { Assassin } from '../variants/Assassin.js';
import { LastManStanding } from '../variants/LastManStanding.js';

// Mock piece from JSON function
/**
 * @param {any} data
 * @param {import('./GameState.js').GameState} [gameState]
 */
function mockPieceFromJSON(data, gameState) {
  switch (data.type) {
    case 'Land':
      return new Piece({ type: 'Land', owner: data.owner, id: data.id, gameState });
    case 'Citadel':
      return new Citadel({ owner: data.owner, id: data.id, gameState });
    default:
      throw new Error(`Unknown piece type: ${data.type}`);
  }
}

/**
 * @param {GameState} state
 * @param {Array<[number, number]>} coords
 */
function setupBoardWithLand(state, coords) {
  for (const [x, y] of coords) {
    state.setTerrain(new Coordinate(x, y), new Piece({ type: 'Land', owner: 'neutral', gameState: state }));
  }
}

describe('Variants', () => {
  it('Assassin: first citadel capture wins', () => {
    const engine = new GameEngine(mockPieceFromJSON, undefined, Assassin);
    engine.addPlayer('A', 'Player A');
    engine.addPlayer('B', 'Player B');
    
    const state = engine.getCurrentState();
    setupBoardWithLand(state, [[0,0],[1,0]]);

    const aCit = new Citadel({ owner: 'A', gameState: state });
    const bCit = new Citadel({ owner: 'B', gameState: state });
    state.setPiece(new Coordinate(0,0), aCit);
    state.setPiece(new Coordinate(1,0), bCit);

    // Simulate capture by A in last action history record
    state.addAction({ type: 'move', pieceId: 'fake', from: '(0, 0)', to: '(1, 0)', captured: bCit.id, capturedType: 'Citadel', capturedOwner: 'B' });
    const end = Assassin.checkEnd(state);
    expect(end.isEnded).toBe(true);
    expect(end.winner).toBe('A');
  });

  it('Last Man Standing: only citadel owner remaining wins', () => {
    const engine = new GameEngine(mockPieceFromJSON, undefined, LastManStanding);
    engine.addPlayer('A', 'Player A');
    engine.addPlayer('B', 'Player B');
    
    const state = engine.getCurrentState();
    setupBoardWithLand(state, [[0,0]]);

    const aCit = new Citadel({ owner: 'A', gameState: state });
    state.setPiece(new Coordinate(0,0), aCit);

    const end = LastManStanding.checkEnd(state);
    expect(end.isEnded).toBe(true);
    expect(end.winner).toBe('A');
  });
});
