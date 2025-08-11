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
    const coord4 = new Coordinate(3, 4);

    expect(coord1.toString()).toBe('(0, 0)');
    expect(coord1.isOrthogonallyAdjacentTo(coord2)).toBe(true);
    expect(coord1.isOrthogonallyAdjacentTo(coord3)).toBe(false);
    expect(coord1.isDiagonallyAdjacentTo(coord3)).toBe(true);
    expect(coord1.isOrthogonallyAdjacentTo(coord4)).toBe(false);
    expect(coord1.isDiagonallyAdjacentTo(coord4)).toBe(false);
    expect(coord1.isAdjacentTo(coord2)).toBe(true);
    expect(coord1.isAdjacentTo(coord3)).toBe(true);
    expect(coord1.isAdjacentTo(coord4)).toBe(false);
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
  /**
   * @type {import('./GameEngine').GameEngine}
   */
  let engine;
  /**
   * @type {import('./GameState').GameState}
   */
  let gameState;

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
    expect(validTargets.some(t => t.coordinate.x === 1 && t.coordinate.y === 0)).toBe(true);
    expect(validTargets.some(t => t.coordinate.x === 0 && t.coordinate.y === 1)).toBe(true);
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
    const targetCell = gameState.getCell(targetCoord);
    
    engine.executeAction(bird, moveAction, targetCell);
    
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
    engine.executeAction(bird1, moveAction, gameState.getCell(new Coordinate(2, 0)));
    
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
      engine.executeAction(bird1, moveAction, gameState.getCell(new Coordinate(1, 0)));
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

  it('should recreate game from serialized data and replay actions', () => {
    // Create a piece factory function to recreate pieces from JSON
    const pieceFactory = (/** @type {any} */ pieceData) => {
      switch (pieceData.type) {
        case 'Bird':
          return Bird.fromJSON(pieceData);
        case 'Soldier':
          return Soldier.fromJSON(pieceData);
        case 'Land':
          return Piece.fromJSON(pieceData);
        default:
          return Piece.fromJSON(pieceData);
      }
    };

    // Set up original game with some actions
    const originalEngine = new GameEngine();
    const originalState = originalEngine.getCurrentState();
    originalState.addPlayer('player1');
    originalState.addPlayer('player2');

    // Create terrain
    const land1 = new Piece({ type: 'Land', owner: 'neutral' });
    const land2 = new Piece({ type: 'Land', owner: 'neutral' });
    const land3 = new Piece({ type: 'Land', owner: 'neutral' });
    originalState.setTerrain(new Coordinate(0, 0), land1);
    originalState.setTerrain(new Coordinate(1, 0), land2);
    originalState.setTerrain(new Coordinate(2, 0), land3);

    // Place and move some pieces to create action history
    const bird1 = new Bird({ owner: 'player1' });
    const bird2 = new Bird({ owner: 'player2' });
    
    originalEngine.placePiece(bird1, new Coordinate(0, 0));
    originalEngine.placePiece(bird2, new Coordinate(2, 0));

    // Move bird1 to capture bird2
    const actions = originalEngine.getValidActionsForPiece(bird1);
    const moveAction = actions[0].action;
    originalEngine.executeAction(bird1, moveAction, originalEngine.gameState.getCell(new Coordinate(2, 0)));

    // Verify we have recorded actions
    expect(originalState.actionHistory.length).toBe(3); // 2 placements + 1 move

    // Serialize the game state
    const serializedData = originalState.toJSON();

    // Recreate game state from serialized data
    const recreatedState = GameState.fromJSON(/** @type {any} */ (serializedData), pieceFactory);
    const recreatedEngine = new GameEngine(recreatedState);

    // Verify basic state is recreated correctly
    expect(recreatedState.players).toEqual(originalState.players);
    expect(recreatedState.currentPlayer).toEqual(originalState.currentPlayer);
    expect(recreatedState.turnNumber).toEqual(originalState.turnNumber);
    expect(recreatedState.actionHistory.length).toBe(originalState.actionHistory.length);

    // Verify terrain is recreated
    expect(recreatedState.hasTerrain(new Coordinate(0, 0))).toBe(true);
    expect(recreatedState.hasTerrain(new Coordinate(1, 0))).toBe(true);
    expect(recreatedState.hasTerrain(new Coordinate(2, 0))).toBe(true);

    // Verify piece placement is recreated correctly
    const recreatedBird = recreatedState.getPieceAt(new Coordinate(2, 0));
    expect(recreatedBird).toBeDefined();
    expect(recreatedBird?.type).toBe('Bird');
    expect(recreatedBird?.owner).toBe('player1');

    // Verify no piece at original bird1 position (moved away)
    expect(recreatedState.getPieceAt(new Coordinate(0, 0))).toBeNull();

    // Verify captured piece is in graveyard
    expect(recreatedState.graveyard.length).toBe(1);
    expect(recreatedState.graveyard[0].type).toBe('Bird');
    expect(recreatedState.graveyard[0].owner).toBe('player2');

    // Verify action history is preserved and contains the expected actions
    const actionHistory = recreatedState.actionHistory;
    const firstAction = /** @type {any} */ (actionHistory[0]);
    const secondAction = /** @type {any} */ (actionHistory[1]);
    const thirdAction = /** @type {any} */ (actionHistory[2]);
    
    expect(firstAction.type).toBe('place');
    expect(secondAction.type).toBe('place');
    expect(thirdAction.type).toBe('move');
    expect(thirdAction.captured).toBeDefined();
  });

  it('should record detailed action history for game replay', () => {
    // Set up game with terrain and pieces
    const engine = new GameEngine();
    const gameState = engine.getCurrentState();
    gameState.addPlayer('player1');
    gameState.addPlayer('player2');

    // Create terrain
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        const land = new Piece({ type: 'Land', owner: 'neutral' });
        gameState.setTerrain(new Coordinate(x, y), land);
      }
    }

    // Perform some actions
    const bird = new Bird({ owner: 'player1' });
    engine.placePiece(bird, new Coordinate(0, 0));
    engine.endTurn();
    
    const soldier = new Soldier({ owner: 'player2' });
    engine.placePiece(soldier, new Coordinate(2, 0));
    engine.endTurn();
    
    // Move bird
    const actions = engine.getValidActionsForPiece(bird);
    engine.executeAction(bird, actions[0].action, gameState.getCell(new Coordinate(1, 0)));
    
    // Verify action history
    expect(gameState.actionHistory.length).toBe(3); // 2 placements + 1 move
    
    const placeAction1 = /** @type {any} */ (gameState.actionHistory[0]);
    const placeAction2 = /** @type {any} */ (gameState.actionHistory[1]);
    const moveAction = /** @type {any} */ (gameState.actionHistory[2]);
    
    // Verify placement actions
    expect(placeAction1.type).toBe('place');
    expect(placeAction1.pieceId).toBe(bird.id);
    expect(placeAction1.at).toBe('(0, 0)');
    expect(placeAction1.player).toBe('player1');
    
    expect(placeAction2.type).toBe('place');
    expect(placeAction2.pieceId).toBe(soldier.id);
    expect(placeAction2.at).toBe('(2, 0)');
    expect(placeAction2.player).toBe('player2');
    
    // Verify move action
    expect(moveAction.type).toBe('move');
    expect(moveAction.pieceId).toBe(bird.id);
    expect(moveAction.from).toBe('(0, 0)');
    expect(moveAction.to).toBe('(1, 0)');
    expect(moveAction.player).toBe('player1');
  });
});