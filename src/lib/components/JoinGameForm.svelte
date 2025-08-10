<script>
  import { generate_name } from '$lib/name_generator.js';

  let { onJoin } = $props();

  let displayName = $state(generate_name());
  let gameCode = $state('');

  /** @param {SubmitEvent} e */
  function submit(e) {
    e.preventDefault();
    onJoin?.({ displayName, gameCode });
  }
</script>

<form aria-describedby="join-help" onsubmit={submit}>
  <fieldset>
    <legend>Player</legend>
    <label for="join-display-name">Display name</label>
    <input id="join-display-name" name="displayName" type="text" bind:value={displayName} required />
  </fieldset>

  <fieldset>
    <legend>Game code</legend>
    <label for="gameCode">Code</label>
    <input id="gameCode" name="gameCode" inputmode="text" minlength="4" maxlength="12" bind:value={gameCode} placeholder="ABC123" required />
  </fieldset>

  <p id="join-help">Ask the host for their code or a direct link.</p>

  <div>
    <button type="submit">Join game</button>
  </div>
</form>
