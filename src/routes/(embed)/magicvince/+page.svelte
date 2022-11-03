<script>
	import VinceVisual from '$lib/components/VinceVisual.svelte';
	import Textfield from '@smui/textfield';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let alg = $page.url.searchParams.get('alg') || 'R U R';
	let lastAlg = $page.url.searchParams.get('alg') || 'R U R';
	$: nextAlg = $page.url.searchParams.get('alg') || 'R U R';
	$: if (nextAlg !== lastAlg) {
		lastAlg = nextAlg;
		alg = nextAlg;
	}
	async function updateURL() {
		$page.url.searchParams.set('alg', alg);
		const query = $page.url.search;
		goto(`${query}`);
	}
</script>

<h1>MagicVince's Visualization</h1>

<Textfield
	style="width: 150px;margin-right:30px;"
	bind:value={alg}
	on:change={updateURL}
	label="Visualize Algorithm"
/>
<VinceVisual bind:alg />
