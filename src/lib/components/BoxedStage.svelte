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

	const dispatch = createEventDispatcher();

	function destroy(event: CustomEvent) {
		store.dispatch(remove_stage({ method, stage: event.detail.item }));
	}
	function create(event: CustomEvent) {
		if (event.detail.item) {
			store.dispatch(add_stage({ method, parent: stage, stage: event.detail.item }));
		}
	}
	function selectStage(event: CustomEvent) {
		nextStage = event.detail.item;
		console.log('Select stage ', nextStage);
		dispatch('stage', { stage: nextStage });
	}

	$: items = ($store.methods.methodToStageMap[method][stage] || []).slice(0).sort();

	let nextStage: string | undefined = undefined;
	$: if (stage) {
		nextStage = undefined;
	}

	$: options = Object.keys($store.stages.stageIdToStageMap).sort();
</script>

<BoxedList {items} {options} on:destroy={destroy} on:new={create} on:select={selectStage} />
{#if nextStage}
	<svelte:self stage={nextStage} {method} on:stage={stageCallback} {stageCallback} />
{/if}
