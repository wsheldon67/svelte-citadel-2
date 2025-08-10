import { describe, it, expect } from 'vitest';
import { GameEngine, GameState, Coordinate, Piece, Citadel, Assassin, LastManStanding } from '../index.js';

/**
 * @param {GameState} state
 * @param {Array<[number, number]>} coords
 */
function setupBoardWithLand(state, coords) {
  for (const [x, y] of coords) {
    state.setTerrain(new Coordinate(x, y), new Piece({ type: 'Land', owner: 'neutral' }));
  }
}

describe('Variants', () => {
  it('Assassin: first citadel capture wins', () => {
    const state = new GameState();
    state.addPlayer('A');
    state.addPlayer('B');
    setupBoardWithLand(state, [[0,0],[1,0]]);

    const engine = new GameEngine(state, Assassin);
  const aCit = new Citadel({ owner: 'A' });
  const bCit = new Citadel({ owner: 'B' });
  engine.placePiece(aCit, new Coordinate(0,0));
  engine.placePiece(bCit, new Coordinate(1,0));

  // Simulate capture by A in last action history record
  state.addAction({ type: 'move', pieceId: 'fake', from: '(0, 0)', to: '(1, 0)', captured: bCit.id, capturedType: 'Citadel', capturedOwner: 'B' });
    const end = engine.checkGameEnd();
    expect(end.isEnded).toBe(true);
    expect(end.winner).toBe('A');
  });

  it('Last Man Standing: only citadel owner remaining wins', () => {
    const state = new GameState();
    state.addPlayer('A');
    state.addPlayer('B');
    setupBoardWithLand(state, [[0,0]]);

    const engine = new GameEngine(state, LastManStanding);
    const aCit = new Citadel({ owner: 'A' });
    engine.placePiece(aCit, new Coordinate(0,0));

    const end = engine.checkGameEnd();
    expect(end.isEnded).toBe(true);
    expect(end.winner).toBe('A');
  });
});
