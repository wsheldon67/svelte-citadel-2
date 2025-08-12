import { test, expect, describe } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { PersistentGameState } from './PersistentGameState.js';
import { Land } from '../pieces/Land.js';
import { Coordinate } from './Coordinate.js';

// Mock piece from JSON function
function mockPieceFromJSON(/** @type {any} */ data) {
  switch (data.type) {
    case 'Land':
      return new Land({
        id: data.id,
        owner: data.owner
      });
    default:
      throw new Error(`Unknown piece type: ${data.type}`);
  }
}

describe('GameEngine2 - Persistent State Design', () => {
  test('should maintain only initial config and actions', () => {
    const engine = new GameEngine(mockPieceFromJSON);
    
    // Add some initial configuration
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    engine.setPhase('land');
    
    // Get the persistent state
    const persistentState = engine.getPersistentState();
    
    // Verify persistent state contains only initial config and actions
    expect(persistentState.initial.players).toEqual(['player1', 'player2']);
    expect(persistentState.initial.playerInfo).toEqual([
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    ]);
    expect(persistentState.initial.phase).toBe('land');
    expect(persistentState.actions).toEqual([]);
    
    // Verify the serialized state only contains persistent data
    const json = engine.toJSON();
    expect(json).toHaveProperty('initial');
    expect(json).toHaveProperty('actions');
    expect(json).toHaveProperty('lastModified');
    
    // Should NOT contain derived state like board, player stashes, etc.
    expect(json).not.toHaveProperty('board');
    expect(json).not.toHaveProperty('playerStashes');
    expect(json).not.toHaveProperty('communityPool');
    expect(json).not.toHaveProperty('currentPlayerIndex');
  });

  test('should derive full state from initial config + actions', () => {
    const engine = new GameEngine(mockPieceFromJSON);
    
    // Set up initial state
    engine.addPlayer('player1', 'Alice');
    engine.setPhase('land');
    
    // Add a land piece to community pool initially
    const initialLand = new Land({ id: 'land1', owner: 'neutral' });
    engine.updateInitialConfig({
      initialPieces: [initialLand.toJSON()]
    });
    
    // Get the derived current state
    const currentState = engine.getCurrentState();
    
    // Verify the derived state has the expected structure
    expect(currentState.players).toEqual(['player1']);
    expect(currentState.phase).toBe('land');
    expect(currentState.communityPool).toHaveLength(1);
    expect(currentState.communityPool[0].type).toBe('Land');
    expect(currentState.playerStashes.has('player1')).toBe(true);
  });

  test('should record actions and replay them correctly', () => {
    const engine = new GameEngine(mockPieceFromJSON);
    
    // Set up initial state  
    engine.addPlayer('player1', 'Alice');
    engine.setPhase('land');
    
    // Add land to initial pieces (community pool) instead of player stash
    const land = new Land({ id: 'land1', owner: 'player1' });
    engine.updateInitialConfig({
      initialPieces: [land.toJSON()]
    });
    
    // Get current state and find the land piece
    const currentState = engine.getCurrentState();
    const landPiece = currentState.communityPool.find(p => p.id === 'land1');
    if (!landPiece) {
      throw new Error('Land piece not found in community pool');
    }
    
    // Move the land piece to player stash for placement
    currentState.communityPool.splice(currentState.communityPool.indexOf(landPiece), 1);
    const playerStash = currentState.playerStashes.get('player1');
    if (playerStash) {
      playerStash.push(landPiece);
    }
    
    // Place the land piece
    const coordinate = new Coordinate(0, 0);
    const targetCell = currentState.getCell(coordinate);
    const landPlace = landPiece.getActions()[0]; // LandPlace action
    const placeAction = new (/** @type {any} */ (landPlace))(landPiece);
    
    // Execute the action
    engine.executeAction(landPiece, placeAction, targetCell);
    
    // Verify action was recorded in persistent state
    const persistentState = engine.getPersistentState();
    expect(persistentState.actions).toHaveLength(1);
    expect(persistentState.actions[0].type).toBe('place');
    expect(persistentState.actions[0].pieceId).toBe('land1');
    expect((/** @type {any} */ (persistentState.actions[0].data)).at).toBe('(0, 0)');
    
    // Create a new engine from the serialized state
    const json = engine.toJSON();
    const engine2 = GameEngine.fromJSON(json, mockPieceFromJSON);
    
    // Verify the new engine has the same derived state
    const newCurrentState = engine2.getCurrentState();
    expect(newCurrentState.hasTerrain(coordinate)).toBe(true);
    const terrain = newCurrentState.getTerrainAt(coordinate);
    expect(terrain?.type).toBe('Land');
    expect(terrain?.id).toBe('land1');
  });

  test('serialized state should be minimal', () => {
    const engine = new GameEngine(mockPieceFromJSON);
    
    // Set up a complex game state
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    engine.setPhase('citadel');
    engine.setSetup({ landsPerPlayer: 3, piecesPerPlayer: 5 });
    
    // Add some initial pieces
    const initialPieces = [
      new Land({ id: 'land1', owner: 'neutral' }),
      new Land({ id: 'land2', owner: 'neutral' })
    ];
    engine.updateInitialConfig({
      initialPieces: initialPieces.map(p => p.toJSON())
    });
    
    // Simulate some actions by manually adding them
    engine.getPersistentState().addAction({
      type: 'place',
      pieceId: 'land1',
      data: { at: '(0, 0)' },
      turnNumber: 1,
      player: 'player1'
    });
    
    engine.getPersistentState().addAction({
      type: 'end_turn',
      pieceId: '',
      data: /** @type {any} */ ({}),
      turnNumber: 1,
      player: 'player1'
    });
    
    // Get serialized state
    const json = engine.toJSON();
    
    // Verify it only contains essential data
    expect(Object.keys(json)).toEqual(['initial', 'actions', 'lastModified']);
    expect(json.initial.players).toEqual(['player1', 'player2']);
    expect(json.actions).toHaveLength(2);
    
    // The serialized state should be much smaller than a full GameState
    const jsonString = JSON.stringify(json);
    expect(jsonString.length).toBeLessThan(1000); // Should be quite compact
    
    // Verify it can be reconstructed
    const engine2 = GameEngine.fromJSON(json, mockPieceFromJSON);
    const reconstructedState = engine2.getCurrentState();
    
    expect(reconstructedState.players).toEqual(['player1', 'player2']);
    expect(reconstructedState.phase).toBe('citadel');
    expect((/** @type {any} */ (reconstructedState.setup))?.landsPerPlayer).toBe(3);
  });
});
