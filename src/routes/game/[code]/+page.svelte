<script>
  import GameBoard from '$lib/components/GameBoard.svelte';
  import { GameEngine, GameState, Coordinate, Piece, Citadel } from '$lib/game';
  import { onMount } from 'svelte';
  import { db, auth } from '$lib/firebase.js';
  import { doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';

  let { data } = $props();
  const code = data.code;
  const setup = data.setup;

  /** Engine + state mirrored from Firestore. */
  let engine = new GameEngine(new GameState());
  let gameState = engine.getCurrentState();

  // Track placement phase: first lands, then citadels
  let phase = /** @type {'land'|'citadel'|'done'} */ ($state('land'));
  let placementsRemaining = $state(0);
  let currentPlayer = $state('');
  let highlights = $state(new Set());
  let unsubGame = /** @type {import('firebase/firestore').Unsubscribe | null} */ ($state(null));

  const myId = $derived(auth.currentUser?.uid || '');

  // Map JSON -> piece instances
  function pieceFromJSON(data) {
    if (!data) return null;
    if (data.type === 'Citadel') return Citadel.fromJSON(data);
    return Piece.fromJSON(data);
  }

  function resetHighlights() { highlights = new Set(); }

  function initPlayersFromLobby(lobby) {
    const players = (lobby?.players || []).map((p) => p.id);
    gameState.players = players;
    if (!gameState.players.length) {
      // Fallback to local single player for dev
      gameState.players = ['P1', 'P2'];
    }
    for (const id of gameState.players) gameState.playerStashes.set(id, []);
    currentPlayer = gameState.currentPlayer;
  }

  function recomputeRemaining() {
    const total = (setup?.landsPerPlayer || 3) * gameState.players.length;
    // Count land tiles on board
    let landCount = 0;
    for (const [key, cell] of gameState.board) {
      if (cell?.terrain?.type === 'Land') landCount++;
    }
    placementsRemaining = Math.max(0, total - landCount);
  }

  function updateHighlightsForLand() {
    if (!myId || currentPlayer !== myId) { highlights = new Set(); return; }
    const e = gameState.getBoardExtents();
    const set = new Set();
    for (let x = e.minX - 5; x <= e.maxX + 5; x++) {
      for (let y = e.minY - 5; y <= e.maxY + 5; y++) {
        const c = new Coordinate(x, y);
        if (!gameState.hasTerrain(c)) set.add(c.key);
      }
    }
    highlights = set;
  }

  function updateHighlightsForCitadel() {
    const set = new Set();
    // Citadels must be placed on Land that is connected to other Land (we'll allow any Land for first citadel)
    for (const coord of gameState.getAllTerrainCoordinates()) {
      set.add(coord.key);
    }
    highlights = set;
  }

  async function placeLandAt(c) {
    if (phase !== 'land') return;
    if (!myId || currentPlayer !== myId) return; // not my turn
    const gameRef = doc(db, 'games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      let data = snap.data();
      if (!data) throw new Error('Game not initialized');
      if (data.phase !== 'land') throw new Error('Not in land phase');

      // Rebuild state
      const state = GameState.fromJSON(data.state, pieceFromJSON);
      const curr = state.currentPlayer;
      if (curr !== myId) throw new Error('Not your turn');
      if (state.hasTerrain(c)) throw new Error('Cell occupied');

      // Place land
      const land = new Piece({ type: 'Land', owner: 'neutral' });
      state.setTerrain(c, land);
      state.addAction({ type: 'place-land', at: c.toString(), player: curr });

      // Compute remaining
      const total = (setup?.landsPerPlayer || 3) * state.players.length;
      let landCount = 0;
      for (const [key, cell] of state.board) if (cell?.terrain?.type === 'Land') landCount++;
      const remaining = Math.max(0, total - landCount);

      // Advance turn or next phase
      /** @type {Record<string, any>} */
      const update = { state: state.toJSON(), updatedAt: serverTimestamp() };
      if (remaining <= 0) {
        update.phase = 'citadel';
      } else {
        state.nextTurn();
        update.state = state.toJSON();
      }
      tx.set(gameRef, update, { merge: true });
    });
  }

  async function placeCitadelAt(c) {
    if (!gameState.hasTerrain(c)) return; // must be on land
    if (gameState.hasPiece(c)) return; // cannot be occupied

    // TODO: make citadel placement transactional with connectivity validation (similar to land)
  }

  /** @param {Coordinate} c */
  function onCellClick(c) {
    if (phase === 'land') return placeLandAt(c);
    if (phase === 'citadel') return placeCitadelAt(c);
  }

  onMount(async () => {
    // Ensure we have an auth user id
    if (!auth.currentUser) {
      // no-op: upstream pages sign in anonymously
      await new Promise((r) => setTimeout(r, 0));
    }

    // Initialize players from lobby and set up games doc if needed
    const lobbyRef = doc(db, 'lobbies', code);
  const lobbySnap = await getDoc(lobbyRef).catch(() => null);
  initPlayersFromLobby(lobbySnap ? lobbySnap.data() : null);

    const gameRef = doc(db, 'games', code);
    const gameSnap = await getDoc(gameRef).catch(() => null);
    if (!gameSnap?.exists()) {
      // Create initial state
      const initState = new GameState();
      for (const id of gameState.players) initState.addPlayer(id);
      const payload = {
        code,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        phase: 'land',
        setup,
        state: initState.toJSON()
      };
      await setDoc(gameRef, payload, { merge: true });
    }

    // Subscribe to game changes
    unsubGame = onSnapshot(gameRef, (snap) => {
      const data = snap.data();
      if (!data) return;
      phase = data.phase || 'land';
      const newState = GameState.fromJSON(data.state, pieceFromJSON);
      engine = new GameEngine(newState);
      gameState = engine.getCurrentState();
      currentPlayer = gameState.currentPlayer;
      recomputeRemaining();
      if (phase === 'land') updateHighlightsForLand();
      else if (phase === 'citadel') updateHighlightsForCitadel();
      else highlights = new Set();
    });
  });
</script>

<header>
  <h1>Citadel: Setup</h1>
  <p>Phase: <strong>{phase}</strong> · Current: <strong>{currentPlayer}</strong> · Remaining: {placementsRemaining}</p>
</header>

<main>
  <GameBoard {gameState} onCellClick={onCellClick} {highlights} />
</main>

<nav aria-label="Setup actions">
  <a href={`/lobby/${code}`}>Back to Lobby</a>
</nav>
