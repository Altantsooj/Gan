<script>
	import VinceVisual from '$lib/components/VinceVisual.svelte';
	import Textfield from '@smui/textfield';
	import { page } from '$app/stores';

	let alg = $page.url.searchParams.get('alg') || 'R U R';
</script>

<h1>MagicVince's Visualization</h1>

<Textfield style="width: 150px;margin-right:30px;" bind:value={alg} label="Visualize Algorithm" />
<VinceVisual bind:alg />
