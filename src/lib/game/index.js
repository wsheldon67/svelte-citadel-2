// Game Engine Core
export { GameEngine2 as GameEngine } from './engine/GameEngine2.js';
export { GameState } from './engine/GameState.js';
export { Coordinate } from './engine/Coordinate.js';
export { RuleViolation } from './engine/RuleViolation.js';

// Base Classes
export { Piece } from './pieces/Piece.js';
export { Action } from './actions/Action.js';
export { Move } from './actions/Move.js';

// Piece Implementations
export { Bird } from './pieces/Bird.js';
export { Soldier } from './pieces/Soldier.js';
export { Builder } from './pieces/Builder.js';
export { Citadel } from './pieces/Citadel.js';
export { Land } from './pieces/Land.js';

// Testing
// export { runBasicTest } from './engine/BasicTest.js'; // Temporarily disabled - needs GameEngine2 compatibility

// Variants
export { Variant } from './variants/Variant.js';
export { Assassin } from './variants/Assassin.js';
export { LastManStanding } from './variants/LastManStanding.js';
