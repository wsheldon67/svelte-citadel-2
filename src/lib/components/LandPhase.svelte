<script>
  import GameBoard from './GameBoard.svelte';
  import { Coordinate } from '$lib/game';

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

  // Generate highlights for valid placement locations
  const highlights = $derived.by(() => {
    if (!isMyTurn) return new Set();
    
    const e = gameState.getBoardExtents();
    const set = new Set();
    for (let x = e.minX - 5; x <= e.maxX + 5; x++) {
      for (let y = e.minY - 5; y <= e.maxY + 5; y++) {
        const c = new Coordinate(x, y);
        if (!gameState.hasTerrain(c)) set.add(c.key);
      }
    }
    return set;
  });

  /** @param {Coordinate} c */
  function onCellClick(c) {
    if (!isMyTurn) return;
    if (gameState.hasTerrain(c)) return;
    onPlaceLand?.(c);
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
