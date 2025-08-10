# Game Variants

Author simple win-condition variants with a tiny, friendly API. Entry-level developers should be able to add new variants by copying one of the examples below.

## Concept
A variant is an object with:
- id: unique key
- name: human-readable name
- checkEnd(gameState): returns { isEnded, winner, reason }
- onAction?(action, gameState): optional hook called after actions are recorded
- availablePieces?: PieceCtors[] — class-based allowlist (lets you ship tweaked classes)
- getAvailablePieces?(state): PieceCtors[] — dynamic class allowlist
- isPieceInstanceAllowed?(piece, state): boolean — fine-grained allow function
- piecePalette?/getPiecePalette?: Variant-provided palette with factories for UI/build

Helpers available from `./Variant.js`:
- countCitadelsByPlayer(gameState): Map of playerId -> count
- playersWithCitadels(gameState): array of playerIds who still have ≥1 citadel
- hasNoCitadel(gameState, playerId)

## Examples
```js
import { Variant, playersWithCitadels } from './Variant.js';
import { Citadel } from '../pieces/Citadel.js';
import { Bird } from '../pieces/Bird.js';

export const ExampleVariant = new Variant({
  id: 'example',
  name: 'Example',
  availablePieces: [Citadel, Bird],
  checkEnd(gameState) {
    const alive = playersWithCitadels(gameState);
    if (alive.length === 1) return { isEnded: true, winner: alive[0], reason: 'Only citadel left' };
    return { isEnded: false, winner: null, reason: null };
  }
});
```

## Using a Variant
```js
import { GameEngine, GameState } from '../engine';
import { Assassin } from './Assassin.js';

const engine = new GameEngine(new GameState(), Assassin);
// ... play ...
const end = engine.checkGameEnd();

// UI can query allowed pieces:
engine.getAvailablePieceClasses();

// A richer palette for UI pickers
const palette = variant.listPiecePalette(engine.getCurrentState());
// palette: [{ key, label, create(owner) => Piece }]
```
