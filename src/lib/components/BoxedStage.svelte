<script lang="ts">
	export let method = '';
	export let stage = 'scrambled';
	export let stageId = 'scrambled';
	export let stageCallback = (e: CustomEvent) => {
		console.log('WRONG CALLBACK');
	};
	export let removeCallback = (method: string, stageName: string) => {
		console.log('MISSING REMOVE CALLBACK');
	};
	export let addCallback = (method: string, parentStageName: string, stageName: string) => {
		console.log('MISSING ADD CALLBACK');
	};

	import { store } from '$lib/store';
	import BoxedList from './BoxedList.svelte';
	import { add_stage, remove_stage } from './methods';
	import { createEventDispatcher } from 'svelte';
	import { dispatch as dispatchToFirebase } from '$lib/actionlog';

	const dispatch = createEventDispatcher();

	function destroy(event: CustomEvent) {
		if ($store.auth.uid) {
			removeCallback(method, event.detail.item);
		}
	}
	function create(event: CustomEvent) {
		if (event.detail.item && $store.auth.uid) {
			addCallback(method, stage, event.detail.item);
		}
	}
	function selectStage(event: CustomEvent) {
		nextStage = event.detail.item;
		nextStageId = lastItems[items.indexOf(event.detail.item)];
		dispatch('stage', { stage: nextStage });
	}

	let lastItems: string[] = [];
	let items: string[] = [];
	$: if ($store.methods.methodToStageMap[method][stageId]) {
		let i = $store.methods.methodToStageMap[method][stageId];
		if (i !== lastItems) {
			lastItems = i;
			items = i
				.slice(0)
				.map((x) => $store.stages.stageIdToStageMap[x].name)
				.sort();
			nextStage = items[0];
			nextStageId = lastItems[0];
		}
	}
	$: options = Object.keys($store.stages.stageIdToStageMap)
		.map((x) => $store.stages.stageIdToStageMap[x].name)
		.sort();

	let nextStage: string | undefined = undefined;
	let nextStageId: string | undefined = undefined;
	$: if (stage) {
		nextStage = items[0];
		nextStageId = lastItems[0];
	}
</script>

<BoxedList {options} {items} on:destroy={destroy} on:new={create} on:select={selectStage} />
{#if nextStage}
	<svelte:self
		stage={nextStage}
		stageId={nextStageId}
		{method}
		on:stage={stageCallback}
		{stageCallback}
		{removeCallback}
		{addCallback}
	/>
{/if}
