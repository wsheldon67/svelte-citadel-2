import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine, GameState, Coordinate, Bird, Soldier, Piece, RuleViolation } from '../index.js';

describe('Game Engine Core', () => {
  it('should create a new game engine', () => {
    const engine = new GameEngine();
    expect(engine).toBeDefined();
    expect(engine.getCurrentState()).toBeInstanceOf(GameState);
  });

  it('should handle coordinate operations', () => {
    const coord1 = new Coordinate(0, 0);
    const coord2 = new Coordinate(1, 0);
    const coord3 = new Coordinate(1, 1);

    expect(coord1.toString()).toBe('(0, 0)');
    expect(coord1.isOrthogonallyAdjacentTo(coord2)).toBe(true);
    expect(coord1.isDiagonallyAdjacentTo(coord3)).toBe(true);
    expect(coord1.isAdjacentTo(coord2)).toBe(true);
    expect(coord1.isAdjacentTo(coord3)).toBe(true);
  });

  it('should manage game state', () => {
    const gameState = new GameState();
    
    gameState.addPlayer('player1');
    gameState.addPlayer('player2');
    
    expect(gameState.players).toEqual(['player1', 'player2']);
    expect(gameState.currentPlayer).toBe('player1');
    expect(gameState.turnNumber).toBe(1);
    
    gameState.nextTurn();
    expect(gameState.currentPlayer).toBe('player2');
  });

  it('should copy game state correctly', () => {
    const gameState = new GameState();
    gameState.addPlayer('player1');
    
    const land = new Piece({ type: 'Land', owner: 'neutral' });
    const coord = new Coordinate(0, 0);
    gameState.setTerrain(coord, land);
    
    const copy = gameState.copy();
    expect(copy.players).toEqual(gameState.players);
    expect(copy.getTerrainAt(coord)).toBeDefined();
    expect(copy.getTerrainAt(coord)).not.toBe(gameState.getTerrainAt(coord)); // Different instance
  });
});

describe('Piece Movement', () => {
  let engine, gameState;

  beforeEach(() => {
    engine = new GameEngine();
    gameState = engine.getCurrentState();
    gameState.addPlayer('player1');
    gameState.addPlayer('player2');

    // Create a simple 3x3 grid
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        const land = new Piece({ type: 'Land', owner: 'neutral' });
        gameState.setTerrain(new Coordinate(x, y), land);
      }
    }
  });

  it('should place pieces correctly', () => {
    const bird = new Bird({ owner: 'player1' });
    const coord = new Coordinate(0, 0);
    
    engine.placePiece(bird, coord);
    
    expect(gameState.getPieceAt(coord)).toBe(bird);
    expect(bird.coordinate).toEqual(coord);
  });

  it('should prevent placing pieces on occupied squares', () => {
    const bird1 = new Bird({ owner: 'player1' });
    const bird2 = new Bird({ owner: 'player2' });
    const coord = new Coordinate(0, 0);
    
    engine.placePiece(bird1, coord);
    
    expect(() => {
      engine.placePiece(bird2, coord);
    }).toThrow(RuleViolation);
  });

  it('should validate Bird movement', () => {
    const bird = new Bird({ owner: 'player1' });
    engine.placePiece(bird, new Coordinate(0, 0));

    const actions = engine.getValidActionsForPiece(bird);
    expect(actions.length).toBe(1);
    expect(actions[0].targets.length).toBeGreaterThan(0);
    
    // Bird should be able to move orthogonally
    const validTargets = actions[0].targets;
    expect(validTargets.some(t => t.x === 1 && t.y === 0)).toBe(true);
    expect(validTargets.some(t => t.x === 0 && t.y === 1)).toBe(true);
  });

  it('should validate Soldier movement', () => {
    const soldier = new Soldier({ owner: 'player1' });
    engine.placePiece(soldier, new Coordinate(1, 1));

    const actions = engine.getValidActionsForPiece(soldier);
    expect(actions.length).toBe(1);
    
    const validTargets = actions[0].targets;
    expect(validTargets.length).toBe(8); // Can move to all 8 adjacent squares
  });

  it('should execute valid moves', () => {
    const bird = new Bird({ owner: 'player1' });
    const startCoord = new Coordinate(0, 0);
    const targetCoord = new Coordinate(1, 0);
    
    engine.placePiece(bird, startCoord);
    
    const actions = engine.getValidActionsForPiece(bird);
    const moveAction = actions[0].action;
    
    engine.executeAction(bird, moveAction, targetCoord);
    
    expect(gameState.getPieceAt(startCoord)).toBeNull();
    expect(gameState.getPieceAt(targetCoord)).toBe(bird);
    expect(bird.coordinate).toEqual(targetCoord);
  });

  it('should handle piece capture', () => {
    const bird1 = new Bird({ owner: 'player1' });
    const bird2 = new Bird({ owner: 'player2' });
    
    engine.placePiece(bird1, new Coordinate(0, 0));
    engine.placePiece(bird2, new Coordinate(2, 0));
    
    const actions = engine.getValidActionsForPiece(bird1);
    const moveAction = actions[0].action;
    
    // Bird1 should be able to capture Bird2
    engine.executeAction(bird1, moveAction, new Coordinate(2, 0));
    
    expect(gameState.getPieceAt(new Coordinate(2, 0))).toBe(bird1);
    expect(gameState.graveyard).toContain(bird2);
  });

  it('should prevent moving to friendly pieces', () => {
    const bird1 = new Bird({ owner: 'player1' });
    const bird2 = new Bird({ owner: 'player1' });
    
    engine.placePiece(bird1, new Coordinate(0, 0));
    engine.placePiece(bird2, new Coordinate(1, 0));
    
    const actions = engine.getValidActionsForPiece(bird1);
    const moveAction = actions[0].action;
    
    expect(() => {
      engine.executeAction(bird1, moveAction, new Coordinate(1, 0));
    }).toThrow(RuleViolation);
  });
});

describe('Action History and Replay', () => {
  it('should record action history', () => {
    const engine = new GameEngine();
    const gameState = engine.getCurrentState();
    gameState.addPlayer('player1');
    
    const land = new Piece({ type: 'Land', owner: 'neutral' });
    gameState.setTerrain(new Coordinate(0, 0), land);
    
    const bird = new Bird({ owner: 'player1' });
    engine.placePiece(bird, new Coordinate(0, 0));
    
    expect(gameState.actionHistory.length).toBe(1);
    const firstAction = /** @type {any} */ (gameState.actionHistory[0]);
    expect(firstAction.type).toBe('place');
  });

  it('should support JSON serialization', () => {
    const gameState = new GameState();
    gameState.addPlayer('player1');
    
    const json = gameState.toJSON();
    const jsonObj = /** @type {any} */ (json);
    expect(jsonObj.players).toEqual(['player1']);
    expect(jsonObj.turnNumber).toBe(1);
  });
});
