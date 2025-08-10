<script>
  import LobbyView from '$lib/components/LobbyView.svelte';

  let { data } = $props();

  const isHost = $derived(Boolean(data?.host));
</script>

<LobbyView code={data.code} name={data.name} isHost={isHost} setup={data.setup} />
