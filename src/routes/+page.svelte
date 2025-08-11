<script>
	import CreateGameForm from '$lib/components/CreateGameForm.svelte';
	import JoinGameForm from '$lib/components/JoinGameForm.svelte';
	import { goto } from '$app/navigation';

	/** Generate a simple alphanumeric game code */
	function generateGameCode() {
		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
		return code;
	}

	/** @param {{displayName:string, playerCount:number, config: any}} payload */
	function handleCreate(payload) {
		const code = generateGameCode();
		// Store game configuration in session storage for immediate access
		// The component will handle creating the Firestore document with proper setup
		sessionStorage.setItem('pendingGameCreation', JSON.stringify({
			code,
			hostName: payload.displayName,
			setup: {
				playerCount: payload.playerCount,
				landsPerPlayer: payload.config.landsPerPlayer,
				personalPiecesPerPlayer: payload.config.personalPiecesPerPlayer,
				communityPiecesPerPlayer: payload.config.communityPiecesPerPlayer,
				variant: payload.config.variant || ''
			}
		}));
		goto(`/${code}`);
	}

	/** @param {{displayName:string, gameCode:string}} payload */
	function handleJoin(payload) {
		const code = (payload.gameCode || '').trim().toUpperCase();
		if (!code) return;
		// Store player name for immediate access
		sessionStorage.setItem('pendingPlayerJoin', JSON.stringify({
			playerName: payload.displayName
		}));
		goto(`/${code}`);
	}
</script>

<header>
	<h1>Citadel</h1>
	<p>Start a new game or join with a code.</p>
	<nav aria-label="Primary">
		<ul>
			<li><a href="/">Home</a></li>
		</ul>
	</nav>
	<hr />
  
</header>

<main>
	<section aria-labelledby="create-game-heading">
		<h2 id="create-game-heading">Create a game</h2>
		<CreateGameForm onCreate={handleCreate} />
	</section>

	<section aria-labelledby="join-game-heading">
		<h2 id="join-game-heading">Join a game</h2>
		<JoinGameForm onJoin={handleJoin} />
	</section>
</main>
