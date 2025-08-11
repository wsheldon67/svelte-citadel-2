<script>
  import { Coordinate } from '$lib/game';

  let { gameState, onCellClick = null, cellSize = 56, margin = 2, highlights = new Set() } = $props();

  /** @returns {{minX:number,maxX:number,minY:number,maxY:number}} */
  function extentsWithMargin() {
    const e = gameState?.getBoardExtents ? gameState.getBoardExtents() : { minX: -5, maxX: 5, minY: -5, maxY: 5 };
    return { minX: e.minX - margin, maxX: e.maxX + margin, minY: e.minY - margin, maxY: e.maxY + margin };
  }

  const e = $derived(extentsWithMargin());
  const cols = $derived(Array.from({ length: e.maxX - e.minX + 1 }, (_, i) => e.minX + i));
  // Render Y from top (maxY) down to bottom (minY)
  const rows = $derived(Array.from({ length: e.maxY - e.minY + 1 }, (_, i) => e.maxY - i));

  /** @param {Coordinate} c */
  function terrainAt(c) { return gameState?.getTerrainAt ? gameState.getTerrainAt(c) : null; }
  /** @param {Coordinate} c */
  function pieceAt(c) { return gameState?.getPieceAt ? gameState.getPieceAt(c) : null; }

  /**
   * Resolve sprite URL for a terrain or piece type.
   * Art set 0 for unowned/neutral pieces, set 1 for player 1, set 2 for player 2, etc.
   * @param {string} type
   * @param {string|null} [owner] - piece owner, if any
   */
  function sprite(type, owner = null) {
    let artSet = 0; // default for terrain and unowned pieces
    
    if (owner && owner !== 'neutral') {
      // Map player IDs to art sets
      const playerIndex = gameState?.players?.indexOf(owner);
      if (playerIndex !== -1 && playerIndex < 2) {
        artSet = playerIndex + 1; // player 0 gets set 1, player 1 gets set 2
      }
    }
    
    return `/art/${artSet}/${type}.png`;
  }

  /** @param {Coordinate} c */
  function clickCell(c) { onCellClick?.(c); }
</script>

<div class="board" style={`--cs:${cellSize}px; --cols:${cols.length}; --rows:${rows.length}`}> 
  {#each rows as y}
    {#each cols as x}
      {@const c = new Coordinate(x, y)}
      {@const key = c.key}
      {@const terrain = terrainAt(c)}
      {@const piece = pieceAt(c)}
      <button
        type="button"
        class={`cell ${highlights.has(key) ? 'hl' : ''}`}
        aria-label={`Cell ${x},${y}`}
        onclick={() => clickCell(c)}
      >
        {#if terrain}
          <img class="terrain" src={sprite(terrain.type, terrain.owner)} alt={terrain.type} />
        {/if}
        {#if piece}
          <img class="piece" src={sprite(piece.type, piece.owner)} alt={piece.type} />
        {/if}
        <span class="coord">{x},{y}</span>
      </button>
    {/each}
  {/each}
</div>

<style>
  .board { display: grid; grid-template-columns: repeat(var(--cols), var(--cs)); grid-template-rows: repeat(var(--rows), var(--cs)); gap: 2px; background: #b3d1ff; padding: 8px; border-radius: 8px; }
  .cell { position: relative; width: var(--cs); height: var(--cs); background: #8ecae6; border: 1px solid #6da9cf; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
  .cell.hl { outline: 3px solid rgba(255, 225, 0, 0.7); outline-offset: -2px; }
  .terrain { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .piece { position: absolute; inset: 6% 6% auto 6%; width: 88%; height: 88%; object-fit: contain; z-index: 2; }
  .coord { position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: rgba(0,0,0,0.4); z-index: 3; }
</style>
