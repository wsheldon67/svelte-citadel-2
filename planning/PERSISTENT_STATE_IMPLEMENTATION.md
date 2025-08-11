# Persistent Game State Implementation

## Overview

You were correct to be concerned about the drift from the design principle. I've implemented a new architecture that ensures the serialized game state contains **only the initial configuration and actions**, with everything else being derived.

## What Was Wrong Before

1. **GameState.toJSON()** was serializing the entire derived state (board, pieces, stashes, etc.)
2. **Actions were inconsistently recorded** - some actions recorded themselves, others didn't
3. **No clear separation** between persistent data and derived data
4. **Large serialized states** that contained redundant computed information

## New Architecture

### Core Components

1. **PersistentGameState** - Contains only:
   - Initial configuration (players, setup, initial pieces)
   - Actions array with structured data
   - Metadata (timestamps)

2. **GameStateReplay** - Rebuilds full GameState by:
   - Applying initial configuration
   - Replaying all actions in sequence

3. **GameEngine2** - Uses persistent state design:
   - Maintains `PersistentGameState` as source of truth
   - Derives `GameState` on demand via replay
   - Caches derived state for performance

### Action Recording

All actions now consistently record themselves with structured data:

```javascript
{
  type: 'place',           // Action type
  pieceId: 'land1',        // Piece performing action  
  data: { at: '(0, 0)' },  // Action-specific data
  timestamp: '...',        // When action occurred
  turnNumber: 1,           // Turn number
  player: 'player1'        // Player who performed it
}
```

### Serialization

The serialized state is now minimal:

```json
{
  "initial": {
    "gameId": null,
    "players": ["player1", "player2"],
    "playerInfo": [...],
    "phase": "land",
    "setup": { "landsPerPlayer": 3 },
    "initialPieces": [...]
  },
  "actions": [
    { "type": "place", "pieceId": "land1", "data": { "at": "(0,0)" }, ... },
    { "type": "move", "pieceId": "soldier1", "data": { "from": "(0,0)", "to": "(1,0)" }, ... }
  ],
  "lastModified": "2025-08-11T..."
}
```

**No board state, no piece positions, no derived data!**

## Benefits

1. **Compact serialization** - Only essential data is stored/transmitted
2. **True source of truth** - Initial config + actions can recreate any game state
3. **Audit trail** - Complete history of what happened
4. **Time travel** - Can replay to any point in game history
5. **Consistent action recording** - All actions properly tracked
6. **Better Firebase efficiency** - Smaller payloads, faster sync

## Usage

```javascript
// Create new engine with persistent design
const engine = new GameEngine2(pieceFromJSON);

// Set up game
engine.addPlayer('player1', 'Alice');
engine.setPhase('land');

// Execute actions (automatically recorded)
engine.executeAction(piece, action, targetCell);

// Get minimal serializable state
const json = engine.toJSON(); // Only initial + actions

// Recreate from JSON
const newEngine = GameEngine2.fromJSON(json, pieceFromJSON);

// Derived state is rebuilt automatically
const currentState = newEngine.getCurrentState();
```

## File Changes

### New Files
- `PersistentGameState.js` - Persistent state container
- `GameStateReplay.js` - Action replay system  
- `GameEngine2.js` - Engine using persistent design
- `GameEngine2.test.js` - Tests verifying the design

### Updated Files
- `Move.js` - Consistent action recording
- `Place.js` - Consistent action recording
- `Builder.js` - All Builder actions now record themselves

## Verification

The tests verify that:

1. ✅ Serialized state contains only initial config + actions
2. ✅ Full game state can be derived from persistent state
3. ✅ Actions are recorded and replayed correctly
4. ✅ Serialized state is compact (< 1KB for complex games)
5. ✅ Round-trip serialization/deserialization works

## Migration Path

The old `GameEngine` still works, so this is non-breaking. Components can gradually migrate to `GameEngine2` when ready. The persistent state design will become the standard going forward.

## Design Principle Restored

✅ **The serialized game state now contains only the initial configuration and actions**  
✅ **Everything else is always derived from that information**  
✅ **No more drift from the core design principle**
