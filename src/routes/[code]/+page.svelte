<script>
  // Clean, simple game page that renders different phases based on GameState
  import LobbyView from '$lib/components/LobbyView.svelte';
  import LandPhase from '$lib/components/LandPhase.svelte';
  import CitadelPhase from '$lib/components/CitadelPhase.svelte';
  import GameOver from '$lib/components/GameOver.svelte';
  import { db, auth } from '$lib/firebase.js';
  import { onMount } from 'svelte';
  import { doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
  import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
  import { GameEngine, GameState, Coordinate, Piece } from '$lib/game';
  import { Citadel } from '$lib/game/pieces/Citadel.js';

  // Load data from +page.js
  let { data } = $props();
  const code = data.code;

  // Check for pending creation from session storage
  const pendingCreation = (() => {
    try {
      const stored = sessionStorage.getItem('pendingGameCreation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.code === code) {
          sessionStorage.removeItem('pendingGameCreation');
          return parsed;
        }
      }
    } catch {}
    return null;
  })();

  const pendingJoin = (() => {
    try {
      const stored = sessionStorage.getItem('pendingPlayerJoin');
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.removeItem('pendingPlayerJoin');
        return parsed;
      }
    } catch {}
    return null;
  })();

  // Single game state from Firestore
  let gameState = $state(new GameState());
  let isLoading = $state(true);
  /** @type {import('firebase/firestore').Unsubscribe | null} */
  let unsubscribe = null;

  // Derived values
  const myId = $derived(auth.currentUser?.uid || '');
  const isHost = $derived(gameState.isHost(myId));
  const players = $derived(gameState.players.map(id => ({ id, name: getPlayerName(id) })));

  // Player name mapping (since we're storing minimal data now)
  let playerNames = $state(new Map());

  /**
   * @param {string} playerId
   * @returns {string}
   */
  function getPlayerName(playerId) {
    return playerNames.get(playerId) || `Player ${playerId.slice(-4)}`;
  }

  // Authentication helper
  async function ensureAnon() {
    if (!auth.currentUser) {
      try { 
        await signInAnonymously(auth); 
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!auth.currentUser) {
      await new Promise((resolve) => {
        const off = onAuthStateChanged(auth, () => { off(); resolve(undefined); });
      });
    }
  }

  /** @param {any} data */
  function pieceFromJSON(data) {
    if (!data) return null;
    // Import proper piece classes as needed
    return Piece.fromJSON(data);
  }

  async function initGame() {
    await ensureAnon();
    const gameRef = doc(db, 'games', code);
    
    // Check if game exists
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      // Create new game only if we have creation data
      if (!pendingCreation) {
        // Game doesn't exist and we're not the creator - redirect or show error
        window.location.href = '/';
        return;
      }
      
      // Initialize game state
      const initState = new GameState();
      initState.setPhase('lobby');
      initState.setSetup(pendingCreation.setup);
      initState.setHost(auth.currentUser?.uid || '');
      initState.addPlayer(auth.currentUser?.uid || '');
      
      // Store player name
      playerNames.set(auth.currentUser?.uid || '', pendingCreation.hostName);

      await setDoc(gameRef, {
        state: initState.toJSON(),
        playerNames: { [auth.currentUser?.uid || '']: pendingCreation.hostName },
        updatedAt: serverTimestamp()
      });
    } else {
      // Join existing game
      const data = gameSnap.data();
      const existingState = GameState.fromJSON(data.state, pieceFromJSON);
      
      // Restore player names
      if (data.playerNames) {
        for (const [id, name] of Object.entries(data.playerNames)) {
          playerNames.set(id, name);
        }
      }
      
      // Add current user if not already a player and game is in lobby
      const myId = auth.currentUser?.uid || '';
      if (!existingState.players.includes(myId) && existingState.phase === 'lobby') {
        const playerName = pendingJoin?.playerName || `Player ${Date.now().toString().slice(-4)}`;
        existingState.addPlayer(myId);
        playerNames.set(myId, playerName);
        
        await updateDoc(gameRef, {
          state: existingState.toJSON(),
          [`playerNames.${myId}`]: playerName,
          updatedAt: serverTimestamp()
        });
      }
    }

    // Subscribe to changes
    unsubscribe = onSnapshot(gameRef, (snap) => {
      const data = snap.data();
      if (!data) return;
      
      gameState = GameState.fromJSON(data.state, pieceFromJSON);
      
      // Update player names
      if (data.playerNames) {
        for (const [id, name] of Object.entries(data.playerNames)) {
          playerNames.set(id, name);
        }
      }
      
      isLoading = false;
    });
  }

  async function startGame() {
    if (!isHost) return;
    
    const gameRef = doc(db, 'games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      const data = snap.data();
      if (!data) throw new Error('Game not found');
      
      const state = GameState.fromJSON(data.state, pieceFromJSON);
      state.setPhase('land');
      
      tx.update(gameRef, {
        state: state.toJSON(),
        updatedAt: serverTimestamp()
      });
    });
  }

  /** @param {Coordinate} coordinate */
  async function placeLand(coordinate) {
    const gameRef = doc(db, 'games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      const data = snap.data();
      if (!data) throw new Error('Game not found');
      
      const state = GameState.fromJSON(data.state, pieceFromJSON);
      if (state.currentPlayer !== myId) throw new Error('Not your turn');
      if (state.hasTerrain(coordinate)) throw new Error('Cell occupied');

      const land = new Piece({ type: 'Land', owner: 'neutral' });
      state.setTerrain(coordinate, land);
      state.addAction({ type: 'place-land', at: coordinate.toString(), player: myId });

      // Check if land phase is complete
      if (!gameState.setup) throw new Error('No setup data');
      /** @type {{landsPerPlayer: number, playerCount: number, personalPiecesPerPlayer: number, communityPiecesPerPlayer: number}} */
      const setup = /** @type {any} */ (gameState.setup);
      const total = setup.landsPerPlayer * state.players.length;
      let landCount = 0;
      for (const [, cell] of state.board) {
        if (cell?.terrain?.type === 'Land') landCount++;
      }

      if (landCount >= total) {
        state.setPhase('citadel');
      } else {
        state.nextTurn();
      }

      tx.update(gameRef, {
        state: state.toJSON(),
        updatedAt: serverTimestamp()
      });
    });
  }

  /** @param {Coordinate} coordinate */
  async function placeCitadel(coordinate) {
    const gameRef = doc(db, 'games', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef);
      const data = snap.data();
      if (!data) throw new Error('Game not found');
      
      const state = GameState.fromJSON(data.state, pieceFromJSON);
      if (state.currentPlayer !== myId) throw new Error('Not your turn');
      if (!state.hasTerrain(coordinate)) throw new Error('Must be on land');
      if (state.hasPiece(coordinate)) throw new Error('Cell occupied');

      const citadel = new Citadel({ owner: myId });
      state.setPiece(coordinate, citadel);
      state.addAction({ type: 'place-citadel', at: coordinate.toString(), player: myId });

      // TODO: Check if citadel phase is complete (when all players have placed their citadels)
      // For now, just advance turn
      state.nextTurn();

      tx.update(gameRef, {
        state: state.toJSON(),
        updatedAt: serverTimestamp()
      });
    });
  }

  onMount(() => {
    initGame();
    return () => { unsubscribe?.(); };
  });
</script>

{#if isLoading}
  <div>Loading game...</div>
{:else if gameState.phase === 'lobby'}
  <LobbyView 
    {code} 
    name={getPlayerName(myId)} 
    {isHost} 
    setup={gameState.setup} 
    {players} 
    onStart={startGame} 
  />
{:else if gameState.phase === 'land'}
  <LandPhase {gameState} {myId} onPlaceLand={placeLand} />
{:else if gameState.phase === 'citadel'}
  <CitadelPhase {gameState} {myId} onPlaceCitadel={placeCitadel} />
{:else if gameState.phase === 'done'}
  <GameOver {gameState} />
{:else}
  <div>Unknown game phase: {gameState.phase}</div>
{/if}
