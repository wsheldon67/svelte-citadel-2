import { Variant, playersWithCitadels } from './Variant.js';
import { Citadel } from '../pieces/Citadel.js';
import { Bird } from '../pieces/Bird.js';
import { Soldier } from '../pieces/Soldier.js';
import { Builder } from '../pieces/Builder.js';

// Last Man Standing: Winner is the player whose Citadel is the only one that remains uncaptured.
export const LastManStanding = new Variant({
  id: 'last-man-standing',
  name: 'Last Man Standing',
  availablePieces: [Citadel, Bird, Soldier, Builder],
  /**
   * @param {import('../engine/GameState.js').GameState} gameState
   */
  checkEnd(gameState) {
    const alive = playersWithCitadels(gameState);
    if (alive.length === 1) {
      return { isEnded: true, winner: alive[0], reason: 'Only player with a Citadel remaining' };
    }
    if (alive.length === 0) {
      return { isEnded: true, winner: null, reason: 'No Citadels remain' };
    }
    return { isEnded: false, winner: null, reason: null };
  }
});
