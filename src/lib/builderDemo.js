import { Builder, BuilderMove, BuilderPlaceTerrain, BuilderRemoveTerrain, BuilderMoveTerrain } from './game/pieces/Builder.js';
import { GameState } from './game/engine/GameState.js';
import { GameEngine } from './game/engine/GameEngine.js';
import { Coordinate } from './game/engine/Coordinate.js';
import { Piece } from './game/pieces/Piece.js';

/**
 * Demo script to test Builder functionality
 */
export function testBuilder() {
  console.log('🏗️ Testing Builder Implementation...\n');
  
  // Create game state and players
  const gameState = new GameState();
  gameState.addPlayer('player1');
  gameState.addPlayer('player2');
  
  // Create game engine
  const engine = new GameEngine(gameState);
  
  // Create pieces
  const builder = new Builder({ owner: 'player1' });
  const land1 = new Piece({ type: 'Land', owner: 'neutral' });
  const land2 = new Piece({ type: 'Land', owner: 'neutral' });
  const land3 = new Piece({ type: 'Land', owner: 'neutral' });
  const enemy = new Piece({ type: 'Soldier', owner: 'player2' });
  
  console.log('1. Setting up initial board...');
  const builderPos = new Coordinate(0, 0);
  const landPos = new Coordinate(1, 0);
  const enemyPos = new Coordinate(0, 1);
  
  // Place builder on land
  gameState.setTerrain(builderPos, land1);
  gameState.setPiece(builderPos, builder);
  builder._setCoordinate(builderPos);
  builder._setGameState(gameState);
  
  // Place land tile next to builder
  gameState.setTerrain(landPos, land2);
  
  // Place enemy on water
  gameState.setPiece(enemyPos, enemy);
  
  // Add land to community pool
  gameState.addToCommunityPool(land3);
  
  console.log(`Builder at ${builderPos.key}`);
  console.log(`Land tile at ${landPos.key}`);
  console.log(`Enemy on water at ${enemyPos.key}`);
  console.log(`Community pool has ${gameState.communityPool.length} land tiles\n`);
  
  // Test 1: Builder movement
  console.log('2. Testing Builder Movement...');
  const builderMove = new BuilderMove(builder);
  const validMoveTargets = builderMove.getValidTargets(gameState);
  console.log(`Builder can move to: ${validMoveTargets.map(c => c.key).join(', ')}`);
  
  // Test 2: Place terrain from community pool
  console.log('\n3. Testing Terrain Placement...');
  const placeTerrain = new BuilderPlaceTerrain(builder);
  const placeTargets = placeTerrain.getValidTargets(gameState);
  console.log(`Builder can place terrain at: ${placeTargets.map(c => c.key).join(', ')}`);
  
  if (placeTargets.length > 0) {
    const targetPos = placeTargets.find(t => t.equals(enemyPos));
    if (targetPos) {
      console.log(`Placing terrain at ${targetPos.key} (should capture enemy)...`);
      placeTerrain.perform(targetPos, gameState);
      console.log(`Enemy captured: ${gameState.graveyard.length > 0 ? 'YES' : 'NO'}`);
      console.log(`Community pool now has ${gameState.communityPool.length} land tiles`);
    }
  }
  
  // Test 3: Remove terrain
  console.log('\n4. Testing Terrain Removal...');
  const removeTerrain = new BuilderRemoveTerrain(builder);
  const removeTargets = removeTerrain.getValidTargets(gameState);
  console.log(`Builder can remove terrain at: ${removeTargets.map(c => c.key).join(', ')}`);
  
  if (removeTargets.length > 0) {
    const targetPos = removeTargets[0];
    console.log(`Removing terrain at ${targetPos.key}...`);
    const beforePool = gameState.communityPool.length;
    removeTerrain.perform(targetPos, gameState);
    const afterPool = gameState.communityPool.length;
    console.log(`Terrain added to community pool: ${afterPool > beforePool ? 'YES' : 'NO'}`);
  }
  
  // Test 4: Move terrain
  console.log('\n5. Testing Terrain Movement...');
  if (removeTargets.length > 1) {
    const sourcePos = removeTargets[1];
    const moveTerrain = new BuilderMoveTerrain(builder, sourcePos);
    const moveTargets = moveTerrain.getValidTargets(gameState);
    console.log(`Builder can move terrain from ${sourcePos.key} to: ${moveTargets.map(c => c.key).join(', ')}`);
    
    if (moveTargets.length > 0) {
      const targetPos = moveTargets[0];
      console.log(`Moving terrain from ${sourcePos.key} to ${targetPos.key}...`);
      moveTerrain.perform(targetPos, gameState);
      console.log(`Terrain moved: ${!gameState.hasTerrain(sourcePos) && gameState.hasTerrain(targetPos) ? 'YES' : 'NO'}`);
    }
  }
  
  // Test 5: Self-destruction
  console.log('\n6. Testing Builder Self-Destruction...');
  const selfRemove = new BuilderRemoveTerrain(builder);
  if (gameState.hasTerrain(builderPos)) {
    console.log(`Builder removing its own tile at ${builderPos.key}...`);
    const beforeGraveyard = gameState.graveyard.length;
    selfRemove.perform(builderPos, gameState);
    const afterGraveyard = gameState.graveyard.length;
    console.log(`Builder sent to graveyard: ${afterGraveyard > beforeGraveyard ? 'YES' : 'NO'}`);
  }
  
  console.log('\n🎉 Builder test completed!');
  console.log(`Final state - Graveyard: ${gameState.graveyard.length} pieces, Community Pool: ${gameState.communityPool.length} tiles`);
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testBuilder();
}
