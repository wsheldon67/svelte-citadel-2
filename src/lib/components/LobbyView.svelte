<script>
  let { code, name, isHost = false, setup, players = [], onStart } = $props();
</script>

<header>
  <h1>Lobby</h1>
  <p>Game code: <strong>{code}</strong></p>
</header>

<main>
  <section aria-labelledby="players-heading">
    <h2 id="players-heading">Players</h2>
    <ul>
      {#each players as p}
        <li>
          <span>{p.name}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="settings-heading">
    <h2 id="settings-heading">Settings</h2>
    <dl>
      <dt>Players</dt>
      <dd>{setup?.playerCount}</dd>
      <dt>Lands per player</dt>
      <dd>{setup?.landsPerPlayer}</dd>
      <dt>Personal pieces per player</dt>
      <dd>{setup?.personalPiecesPerPlayer}</dd>
      <dt>Community pieces per player</dt>
      <dd>{setup?.communityPiecesPerPlayer}</dd>
      {#if setup?.variant}
        <dt>Variant</dt>
        <dd>{setup.variant}</dd>
      {/if}
    </dl>
  </section>

  <nav aria-label="Lobby actions">
    <ul>
      <li><a href="/">Back</a></li>
      {#if isHost}
  <li><button type="button" onclick={onStart}>Start game</button></li>
      {/if}
    </ul>
  </nav>
</main>
