<script lang="ts">
	import BoxedList from '$lib/components/BoxedList.svelte';
	import BoxedStage from '$lib/components/BoxedStage.svelte';
	import SVGCube from '$lib/components/SVGCube.svelte';
	import { delete_method, new_method, remove_stage, rename_stage } from '$lib/components/methods';
	import { store } from '$lib/store';

	$: items = Object.keys($store.methods.methodToStageMap).sort();
	let method: string | undefined = undefined;

	function destroy(event: CustomEvent) {
		store.dispatch(delete_method(event.detail.item));
	}
	function create(event: CustomEvent) {
		if (event.detail.item) {
			store.dispatch(new_method(event.detail.item));
		}
	}
	function selectMethod(event: CustomEvent) {
		method = event.detail.item;
	}

	let stage: string | undefined = undefined;
	function stageCallback(event: CustomEvent) {
		stage = event.detail.stage;
		console.log('STAGE: ', stage);
	}
	function renameStage(event: CustomEvent) {
		if (method && stage) {
			store.dispatch(rename_stage({ method, stage, name: event.detail.stage }));
			stage = event.detail.stage;
		}
	}
	function destroyStage(event: CustomEvent) {
		if (method && stage) {
			store.dispatch(remove_stage({ method, stage }));
			stage = '';
		}
	}
</script>

<div class="column">
	<div class="row">
		<BoxedList {items} on:destroy={destroy} on:new={create} on:select={selectMethod} />
		{#if method}
			<BoxedStage {method} {stageCallback} on:stage={stageCallback} />
		{/if}
	</div>
	<div class="row">
		{#if stage}
			<SVGCube {stage} on:destroy={destroyStage} on:stage={renameStage} />
		{/if}
	</div>
</div>

<style>
	.column {
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		flex-direction: row;
	}
</style>
