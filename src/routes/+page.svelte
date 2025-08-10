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
		const params = new URLSearchParams({
			name: payload.displayName,
			host: '1',
			pc: String(payload.playerCount),
			lpp: String(payload.config.landsPerPlayer),
			ppp: String(payload.config.personalPiecesPerPlayer),
			cpp: String(payload.config.communityPiecesPerPlayer),
			variant: String(payload.config.variant || '')
		});
		goto(`/lobby/${code}?${params.toString()}`);
	}

		/** @param {{displayName:string, gameCode:string}} payload */
		function handleJoin(payload) {
		const code = (payload.gameCode || '').trim().toUpperCase();
		if (!code) return;
		const params = new URLSearchParams({ name: payload.displayName });
		goto(`/lobby/${code}?${params.toString()}`);
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
