import { Variant, playersWithCitadels } from './Variant.js';
import { Citadel } from '../pieces/Citadel.js';
import { Bird } from '../pieces/Bird.js';
import { Soldier } from '../pieces/Soldier.js';
import { Builder } from '../pieces/Builder.js';

// Assassin: First player to capture any opponent's Citadel wins immediately.
export const Assassin = new Variant({
  id: 'assassin',
  name: 'Assassin',
  // Class-based allowlist (authors can swap in tweaked classes)
  availablePieces: [Citadel, Bird, Soldier, Builder],
  /**
   * @param {import('../engine/GameState.js').GameState} gameState
   */
  checkEnd(gameState) {
    // If exactly one move captured a citadel last action, that mover wins.
    const last = /** @type {any} */ (gameState.actionHistory[gameState.actionHistory.length - 1]);
    if (last && last.type === 'move' && last.capturedType === 'Citadel' && last.capturedOwner) {
      return { isEnded: true, winner: last.player, reason: `${last.player} captured ${last.capturedOwner}'s Citadel` };
    }
    // Also if any player is the only one with citadels (edge-case after setup), they win.
    const alive = playersWithCitadels(gameState);
    if (alive.length === 1) {
      return { isEnded: true, winner: alive[0], reason: 'Only player with a Citadel' };
    }
    return { isEnded: false, winner: null, reason: null };
  }
});
