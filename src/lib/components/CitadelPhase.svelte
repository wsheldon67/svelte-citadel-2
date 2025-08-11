<script>
  import GameBoard from './GameBoard.svelte';
  import { Coordinate } from '$lib/game';

  let { gameState, myId, onPlaceCitadel } = $props();
  
  const isMyTurn = $derived(gameState.currentPlayer === myId);

  // Generate highlights for valid citadel placement locations
  const highlights = $derived.by(() => {
    const set = new Set();
    for (const coord of gameState.getAllTerrainCoordinates()) {
      if (gameState.hasTerrain(coord) && !gameState.hasPiece(coord)) {
        set.add(coord.key);
      }
    }
    return set;
  });

  /** @param {Coordinate} c */
  function onCellClick(c) {
    if (!isMyTurn) return;
    if (!gameState.hasTerrain(c)) return; // must be on land
    if (gameState.hasPiece(c)) return; // cannot be occupied
    onPlaceCitadel?.(c);
  }
</script>

<header>
  <h1>Citadel - Citadel Placement</h1>
  <p>
    Current player: <strong>{gameState.currentPlayer}</strong>
    {#if isMyTurn}(Your turn){/if}
  </p>
  <p>Place your citadels on land tiles</p>
</header>

<main>
  <GameBoard {gameState} {onCellClick} {highlights} />
</main>
