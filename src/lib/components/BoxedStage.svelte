<script lang="ts">
	export let method = '';
	export let stage = 'scrambled';
	export let stageCallback = (e: CustomEvent) => {
		console.log('WRONG CALLBACK');
	};

	import { store } from '$lib/store';
	import BoxedList from './BoxedList.svelte';
	import { add_stage, remove_stage } from './methods';
	import { createEventDispatcher } from 'svelte';
	import { dispatch as dispatchToFirebase } from '$lib/actionlog';

	const dispatch = createEventDispatcher();

	function destroy(event: CustomEvent) {
		if ($store.auth.uid) {
			dispatchToFirebase(
				'methods',
				method,
				$store.auth.uid,
				remove_stage({ method, stage: event.detail.item })
			);
		}
	}
	function create(event: CustomEvent) {
		if (event.detail.item && $store.auth.uid) {
			dispatchToFirebase(
				'methods',
				method,
				$store.auth.uid,
				add_stage({ method, parent: stage, stage: event.detail.item })
			);
		}
	}
	function selectStage(event: CustomEvent) {
		nextStage = event.detail.item;
		dispatch('stage', { stage: nextStage });
	}

	let lastItems: string[] = [];
	let items: string[] = [];
	$: if ($store.methods.methodToStageMap[method][stage]) {
		let i = $store.methods.methodToStageMap[method][stage];
		if (i !== lastItems) {
			lastItems = i;
			items = i.slice(0).sort();
		}
	}
	$: options = Object.keys($store.stages.stageIdToStageMap)
		.map((x) => $store.stages.stageIdToStageMap[x].name)
		.sort();

	let nextStage: string | undefined = undefined;
	$: if (stage) {
		nextStage = undefined;
	}
</script>

<BoxedList {options} {items} on:destroy={destroy} on:new={create} on:select={selectStage} />
{#if nextStage}
	<svelte:self stage={nextStage} {method} on:stage={stageCallback} {stageCallback} />
{/if}
