import { GameEngine } from '../engine/GameEngine.js';
import { GameState } from '../engine/GameState.js';
import { Coordinate } from '../engine/Coordinate.js';
import { Bird } from '../pieces/Bird.js';
import { Soldier } from '../pieces/Soldier.js';
import { Piece } from '../pieces/Piece.js';

/**
 * Simple test to verify the game engine works
 */
export function runBasicTest() {
  console.log('Running basic game engine test...');
  
  try {
    // Create a new game
    const engine = new GameEngine();
    const gameState = engine.getCurrentState();
    
    // Add two players
    gameState.addPlayer('player1');
    gameState.addPlayer('player2');
    
    console.log('✓ Created game with two players');
    
    // Create some simple terrain (land tiles)
    const landPiece1 = new Piece({ type: 'Land', owner: 'neutral' });
    const landPiece2 = new Piece({ type: 'Land', owner: 'neutral' });
    const landPiece3 = new Piece({ type: 'Land', owner: 'neutral' });
    
    gameState.setTerrain(new Coordinate(0, 0), landPiece1);
    gameState.setTerrain(new Coordinate(1, 0), landPiece2);
    gameState.setTerrain(new Coordinate(2, 0), landPiece3);
    
    console.log('✓ Created terrain tiles');
    
    // Create and place pieces
    const bird = new Bird({ owner: 'player1' });
    const soldier = new Soldier({ owner: 'player2' });
    
    engine.placePiece(bird, new Coordinate(0, 0));
    engine.placePiece(soldier, new Coordinate(2, 0));
    
    console.log('✓ Placed Bird at (0,0) and Soldier at (2,0)');
    
    // Test Bird movement
    const birdActions = engine.getValidActionsForPiece(bird);
    console.log(`✓ Bird has ${birdActions.length} valid action types`);
    
    if (birdActions.length > 0) {
      const moveTargets = birdActions[0].targets;
      console.log(`✓ Bird can move to ${moveTargets.length} positions:`, 
        moveTargets.map(t => t.toString()));
    }
    
    // Test Soldier movement
    const soldierActions = engine.getValidActionsForPiece(soldier);
    console.log(`✓ Soldier has ${soldierActions.length} valid action types`);
    
    if (soldierActions.length > 0) {
      const moveTargets = soldierActions[0].targets;
      console.log(`✓ Soldier can move to ${moveTargets.length} positions:`, 
        moveTargets.map(t => t.toString()));
    }
    
    // Test state copying
    const copiedState = gameState.copy();
    console.log('✓ Successfully copied game state');
    
    // Test JSON serialization
    const json = gameState.toJSON();
    console.log('✓ Successfully serialized game state to JSON');
    
    console.log('\n🎉 All basic tests passed!');
    
    return {
      success: true,
      engine,
      bird,
      soldier,
      gameState
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error
    };
  }
}

// Export for use in other modules
export { GameEngine, GameState, Coordinate, Bird, Soldier };
