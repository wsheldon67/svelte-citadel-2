<script>
  import LobbyView from '$lib/components/LobbyView.svelte';
  import { db, auth } from '$lib/firebase.js';
  import { onMount } from 'svelte';
  import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp } from 'firebase/firestore';
  import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

  let { data } = $props();
  const code = data.code;
  const name = data.name || '';
  const isHost = !!data.host;
  const setup = data.setup || null;

  /** @type {Array<{id:string,name:string,host?:boolean,joinedAt?:any}>} */
  let players = $state([]);
  /** @type {import('firebase/firestore').Unsubscribe | null} */
  let unsub = null;
  let navigated = $state(false);

  function navigateToGame() {
    if (navigated) return;
    navigated = true;
    try {
      const params = new URLSearchParams({
        pc: String(setup?.playerCount || 2),
        lpp: String(setup?.landsPerPlayer || 3),
        ppp: String(setup?.personalPiecesPerPlayer || 3),
        cpp: String(setup?.communityPiecesPerPlayer || 3),
        variant: String(setup?.variant || '')
      });
      const url = `/game/${code}?${params}`;
      import('$app/navigation').then(({ goto }) => goto(url)).catch(() => { location.href = url; });
    } catch {}
  }

  async function ensureAnon() {
    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch {}
      // wait one tick for currentUser
      await new Promise((r) => setTimeout(r, 0));
    }
    if (!auth.currentUser) {
      // as a fallback, wait for the next auth state change
      await new Promise((resolve) => {
        const off = onAuthStateChanged(auth, () => { off(); resolve(undefined); });
      });
    }
  }

  /** @param {import('firebase/firestore').DocumentReference} lobbyRef */
  async function upsertPlayer(lobbyRef) {
    const uid = auth.currentUser?.uid || 'anon';
    const snap = await getDoc(lobbyRef);
    if (!snap.exists()) {
      await setDoc(lobbyRef, {
        code,
        status: 'lobby',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        setup: setup || null,
        players: [
          { id: uid, name: name || 'Player', host: !!isHost, joinedAt: serverTimestamp() }
        ]
      }, { merge: true });
      return;
    }
    const data = snap.data();
  const exists = Array.isArray(data.players) && data.players.some((/** @type {{id:string}} */ p) => p.id === uid);
    if (!exists) {
      await updateDoc(lobbyRef, {
        players: arrayUnion({ id: uid, name: name || 'Player', host: false, joinedAt: new Date() }),
        updatedAt: serverTimestamp()
      });
    }
  }

  async function initLobby() {
    await ensureAnon();
    const lobbyRef = doc(db, 'lobbies', code);
    if (isHost) {
      // Ensure lobby exists with host listed
      await setDoc(lobbyRef, {
        code,
        status: 'lobby',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        setup: setup || null
      }, { merge: true });
    }
    await upsertPlayer(lobbyRef);

  unsub = onSnapshot(lobbyRef, (snap) => {
      const d = snap.data();
      players = (d?.players || []);
      // If host has started the game, everyone moves to land placement
      if (d?.status === 'started') navigateToGame();
    });
  }

  function onStart() {
    const lobbyRef = doc(db, 'lobbies', code);
    updateDoc(lobbyRef, { status: 'started', updatedAt: serverTimestamp() });
    // Optimistically navigate host; others will navigate via snapshot
    navigateToGame();
  }

  onMount(() => {
    initLobby();
    return () => unsub?.();
  });
</script>

<LobbyView {code} {name} {isHost} {setup} {players} onStart={onStart} />
