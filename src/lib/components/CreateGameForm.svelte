<script>
  import { generate_name } from '$lib/name_generator.js';

  let { onCreate } = $props();

  let displayName = $state(generate_name());
  let playerCount = $state(2);
  let landsPerPlayer = $state(3);
  let personalPieces = $state(3);
  let communityPieces = $state(3);
  let variant = $state('');

  /** @param {SubmitEvent} e */
  function submit(e) {
    e.preventDefault();
    onCreate?.({
      displayName,
      playerCount,
      config: {
        landsPerPlayer,
        personalPiecesPerPlayer: personalPieces,
        communityPiecesPerPlayer: communityPieces,
        variant
      }
    });
  }
</script>

<form aria-describedby="create-help" onsubmit={submit}>
  <fieldset>
    <legend>Host</legend>
    <label for="displayName">Display name</label>
  <input id="displayName" name="displayName" type="text" bind:value={displayName} required />
  </fieldset>

  <fieldset>
    <legend>Players</legend>
    <label for="playerCount">Players</label>
  <input id="playerCount" name="playerCount" type="number" min="2" max="8" bind:value={playerCount} />
  </fieldset>

  <fieldset>
    <legend>Setup</legend>
    <label for="lands">Lands per player</label>
  <input id="lands" name="lands" type="number" min="0" max="20" bind:value={landsPerPlayer} />

    <label for="personalPieces">Personal pieces per player</label>
  <input id="personalPieces" name="personalPieces" type="number" min="0" max="20" bind:value={personalPieces} />

    <label for="communityPieces">Community pieces per player</label>
  <input id="communityPieces" name="communityPieces" type="number" min="0" max="20" bind:value={communityPieces} />

    <label for="variant">Variant (optional)</label>
  <input id="variant" name="variant" type="text" bind:value={variant} placeholder="e.g., Assassin" />
  </fieldset>

  <p id="create-help">You can tweak these later. A game code will be generated.</p>

  <div>
    <button type="submit">Create game</button>
  </div>
</form>
