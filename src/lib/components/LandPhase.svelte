<script>
  import GameBoard from './GameBoard.svelte';
  import { Coordinate } from '$lib/game';
  import { Land, LandPlace } from '$lib/game/pieces/Land.js';
  import { RuleViolation } from '$lib/game/engine/Errors.js';

  let { gameState, myId, onPlaceLand } = $props();
  
  const isMyTurn = $derived(gameState.currentPlayer === myId);
  
  // Calculate remaining land placements
  const placementsRemaining = $derived.by(() => {
    if (!gameState.setup) return 0;
    const total = gameState.setup.landsPerPlayer * gameState.players.length;
    let landCount = 0;
    for (const [, cell] of gameState.board) {
      if (cell?.terrain?.type === 'Land') landCount++;
    }
    return Math.max(0, total - landCount);
  });

  // Generate highlights for valid placement locations using Land placement rules
  const highlights = $derived.by(() => {
    if (!isMyTurn) return new Set();
    
    const set = new Set();
    const e = gameState.getBoardExtents();
    
    // Create a temporary Land piece for validation
    const tempLand = new Land({ owner: 'neutral' });
    const landPlace = new LandPlace(tempLand);
    
    // Check each coordinate in the search area
    for (let x = e.minX - 3; x <= e.maxX + 3; x++) {
      for (let y = e.minY - 3; y <= e.maxY + 3; y++) {
        const c = new Coordinate(x, y);
        const targetCell = gameState.getCell(c);
        
        try {
          // Use the Land placement rules to validate
          landPlace.check(targetCell, gameState, gameState);
          set.add(c.key);
        } catch (error) {
          // If LandPlace validation fails, this isn't a valid placement location
          if (error instanceof RuleViolation) {
            // Skip this coordinate
            continue;
          }
          // Re-throw non-rule violations (unexpected errors)
          throw error;
        }
      }
    }
    
    return set;
  });

  /** @param {Coordinate} c */
  function onCellClick(c) {
    if (!isMyTurn) return;
    
    // Validate placement using Land rules before calling parent
    const tempLand = new Land({ owner: 'neutral' });
    const landPlace = new LandPlace(tempLand);
    const targetCell = gameState.getCell(c);
    
    try {
      landPlace.check(targetCell, gameState, gameState);
      onPlaceLand?.(c);
    } catch (error) {
      if (error instanceof RuleViolation) {
        console.warn('Invalid land placement:', error.message);
        // Could show a toast/notification here
        return;
      }
      throw error;
    }
  }
</script>

<header>
  <h1>Citadel - Land Placement</h1>
  <p>
    Current player: <strong>{gameState.currentPlayer}</strong>
    {#if isMyTurn}(Your turn){/if}
  </p>
  <p>Remaining land placements: <strong>{placementsRemaining}</strong></p>
</header>

<main>
  <GameBoard {gameState} {onCellClick} {highlights} />
</main>
