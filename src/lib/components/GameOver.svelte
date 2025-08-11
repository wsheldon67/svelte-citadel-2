<script>
  import GameBoard from './GameBoard.svelte';

  let { gameState } = $props();

  // TODO: Implement proper win condition checking
  const winner = $derived(gameState.players[0]); // Placeholder
</script>

<header>
  <h1>Citadel - Game Complete</h1>
  <p>Winner: <strong>{winner}</strong></p>
</header>

<main>
  <GameBoard {gameState} />
  
  <section>
    <h2>Final Game State</h2>
    <p>The game has ended. View the final board state above.</p>
    
    <nav>
      <a href="/">New Game</a>
    </nav>
  </section>
</main>
