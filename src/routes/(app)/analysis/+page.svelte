<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Solve from '$lib/components/Solve.svelte';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';

	const solveId = $page.url.searchParams.get('solve') || 'error';
	const sourcePage = $page.url.searchParams.get('from') || 'timer';
	const methodId = $store.preferences.solutionMethodId || undefined;

	function next() {
		console.log('navigate to ', sourcePage);
		goto('/' + sourcePage);
	}
	let displayMode = sourcePage !== 'trending_down' ? 'times' : 'moves';
</script>

<div class="container">
	<Solve {methodId} {solveId} {displayMode} />
	<Button on:click={next}>
		<Label>Next Scramble</Label>
		<i class="material-icons" aria-hidden="true">arrow_forward</i>
	</Button>
</div>

<style>
	.container {
		width: 100%;
	}
</style>
