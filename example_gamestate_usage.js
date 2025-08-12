/**
 * Example demonstrating how to use the optional GameState parameter with Pieces
 */

import { GameState } from './src/lib/game/engine/GameState.js';
import { Piece } from './src/lib/game/pieces/Piece.js';
import { Coordinate } from './src/lib/game/engine/Coordinate.js';

// Example 1: Creating a piece without game state (for testing or edge cases)
const pieceWithoutGameState = new Piece({
  type: 'TestPiece',
  owner: 'player1'
});

console.log('Piece without game state:');
console.log('  Game state:', pieceWithoutGameState.gameState); // null
console.log('  Can check paths:', pieceWithoutGameState.isPathClear(new Coordinate(1, 1))); // false (no game state)

// Example 2: Creating a piece with game state
const gameState = new GameState();
gameState.addPlayer('player1', 'Alice');

const pieceWithGameState = new Piece({
  type: 'TestPiece',
  owner: 'player1',
  gameState: gameState
});

console.log('\nPiece with game state:');
console.log('  Game state available:', !!pieceWithGameState.gameState); // true
console.log('  Current player:', pieceWithGameState.gameState.currentPlayer); // player1

// Example 3: Game state is automatically set when piece is placed on board
const coordinate = new Coordinate(0, 0);
gameState.setPiece(coordinate, pieceWithoutGameState);

console.log('\nAfter placing piece on board:');
console.log('  Game state now available:', !!pieceWithoutGameState.gameState); // true
console.log('  Piece coordinate:', pieceWithoutGameState.coordinate.toString()); // (0, 0)

// Example 4: Copying pieces preserves game state
const copiedPiece = pieceWithGameState.copy();
console.log('\nCopied piece:');
console.log('  Game state preserved:', !!copiedPiece.gameState); // true

// Example 5: Creating pieces from JSON with game state
const pieceJSON = {
  type: 'TestPiece',
  owner: 'player1',
  id: 'test-123'
};

const pieceFromJSON = Piece.fromJSON(pieceJSON, gameState);
console.log('\nPiece from JSON:');
console.log('  Game state available:', !!pieceFromJSON.gameState); // true
