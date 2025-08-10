import { runBasicTest } from './lib/game/engine/BasicTest.js';
import { GameEngine, Coordinate, Bird, Soldier, Piece } from './lib/game/index.js';

/**
 * Demonstration of the game engine
 */
async function demo() {
  console.log('=== Citadel Game Engine Demo ===\n');
  
  // Run basic tests first
  const testResult = runBasicTest();
  if (!testResult.success) {
    console.error('Basic tests failed, stopping demo');
    return;
  }
  
  console.log('\n=== Advanced Demo ===\n');
  
  // Create a more detailed game scenario
  const engine = new GameEngine();
  const gameState = engine.getCurrentState();
  
  // Set up players
  gameState.addPlayer('Alice');
  gameState.addPlayer('Bob');
  
  // Create a 3x3 grid of land
  console.log('Setting up a 3x3 battlefield...');
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      const land = new Piece({ type: 'Land', owner: 'neutral' });
      gameState.setTerrain(new Coordinate(x, y), land);
    }
  }
  
  // Place pieces
  const aliceBird = new Bird({ owner: 'Alice' });
  const aliceSoldier = new Soldier({ owner: 'Alice' });
  const bobBird = new Bird({ owner: 'Bob' });
  const bobSoldier = new Soldier({ owner: 'Bob' });
  
  engine.placePiece(aliceBird, new Coordinate(0, 0));
  engine.placePiece(aliceSoldier, new Coordinate(0, 1));
  engine.placePiece(bobBird, new Coordinate(2, 2));
  engine.placePiece(bobSoldier, new Coordinate(2, 1));
  
  console.log('✓ Placed pieces on the battlefield');
  console.log('  Alice: Bird at (0,0), Soldier at (0,1)');
  console.log('  Bob: Bird at (2,2), Soldier at (2,1)');
  
  // Show current player
  console.log(`\nCurrent player: ${gameState.currentPlayer}`);
  console.log(`Turn number: ${gameState.turnNumber}`);
  
  // Analyze Alice's options (she goes first)
  const aliceActions = engine.getValidActionsForPlayer('Alice');
  console.log(`\nAlice has ${aliceActions.length} pieces with valid actions:`);
  
  // Debug: Check all Alice's pieces, even those without valid actions
  console.log('\nDebug - All Alice pieces:');
  for (const [key, cell] of gameState.board) {
    if (cell.piece && cell.piece.owner === 'Alice') {
      const coordinate = Coordinate.fromKey(key);
      cell.piece._setCoordinate(coordinate);
      cell.piece._setGameState(gameState);
      
      console.log(`  ${cell.piece.type} at ${coordinate.toString()}`);
      console.log(`    Has coordinate: ${cell.piece.coordinate !== null}`);
      console.log(`    Actions available: ${cell.piece.getActions().length}`);
      
      const actions = engine.getValidActionsForPiece(cell.piece);
      console.log(`    Valid actions: ${actions.length}`);
      
      // Debug: Try to get targets for the first action
      if (cell.piece.getActions().length > 0) {
        /** @type {typeof import('./lib/game/actions/Action.js').Action} */
        const ActionClass = /** @type {any} */ (cell.piece.getActions()[0]);
        const action = new ActionClass(cell.piece);
        const targets = action.getValidTargets(gameState);
        console.log(`    Potential targets: ${targets.length}`);
        
        if (targets.length > 0) {
          const firstTarget = targets[0];
          console.log(`    Testing move to ${firstTarget.toString()}:`);
          try {
            engine.checkAction(cell.piece, action, firstTarget);
            console.log(`      ✓ Valid move`);
          } catch (error) {
            console.log(`      ❌ Invalid: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }
  }
  
  for (const { piece, actions } of aliceActions) {
    console.log(`  ${piece.type} at ${piece.coordinate?.toString()}:`);
    for (const { action, targets } of actions) {
      console.log(`    ${action.getDescription()}: ${targets.length} targets`);
      if (targets.length > 0) {
        console.log(`      Can move to: ${targets.slice(0, 3).map(t => t.toString()).join(', ')}${targets.length > 3 ? '...' : ''}`);
      }
    }
  }
  
  // Try to move Alice's bird
  if (aliceActions.length > 0) {
    const birdData = aliceActions.find(p => p.piece.type === 'Bird');
    if (birdData && birdData.actions.length > 0) {
      const moveAction = birdData.actions[0];
      if (moveAction.targets.length > 0) {
        const target = moveAction.targets[0];
        
        console.log(`\nAlice moves her Bird to ${target.toString()}`);
        try {
          engine.executeAction(birdData.piece, moveAction.action, target);
          console.log('✓ Move executed successfully');
          
          // Check new state
          console.log(`Bird is now at: ${birdData.piece.coordinate?.toString()}`);
          console.log(`Turn number: ${gameState.turnNumber}`);
          console.log(`Current player: ${gameState.currentPlayer}`);
          
        } catch (error) {
          console.error('❌ Move failed:', error instanceof Error ? error.message : String(error));
        }
      }
    }
  }
  
  // Show action history
  console.log('\nAction History:');
  for (const action of gameState.actionHistory) {
    const actionObj = /** @type {any} */ (action);
    console.log(`  ${actionObj.type}: ${JSON.stringify(action, null, 2)}`);
  }
  
  console.log('\n=== Demo Complete ===');
}

// Run the demo
demo().catch(console.error);
