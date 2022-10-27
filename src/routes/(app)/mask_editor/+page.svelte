<script lang="ts">
	import BoxedList from '$lib/components/BoxedList.svelte';
	import BoxedStage from '$lib/components/BoxedStage.svelte';
	import SVGCube from '$lib/components/SVGCube.svelte';
	import {
		add_stage,
		delete_method,
		new_method,
		remove_stage,
		rename_stage
	} from '$lib/components/methods';
	import { store } from '$lib/store';
	import { onMount, onDestroy } from 'svelte';
	import { dispatch } from '$lib/actionlog';
	import { create as createMethod } from '$lib/actionlog';
	import { new_stage, stages, type Stage } from '$lib/components/stages';
	import { Mask, type MaskT } from '$lib/third_party/onionhoney/CubeLib';
	import AlgSetsEditor from '$lib/components/AlgSetsEditor.svelte';

	$: entries = Object.entries($store.methods.methodToNameMap);
	$: items = entries.map((x) => x[1]);
	let methodIndex: number | undefined = undefined;
	let methodId = '';

	function destroy(event: CustomEvent) {
		if (event.detail.index !== undefined && $store.auth.uid) {
			const docId = entries[event.detail.index][0];
			dispatch('methods', docId, $store.auth.uid, delete_method(docId));
		}
	}
	async function create(event: CustomEvent) {
		if (event.detail.item && $store.auth.uid) {
			const doc = await createMethod('methods', $store.auth.uid);
			dispatch(
				'methods',
				doc.id,
				$store.auth.uid,
				new_method({ name: event.detail.item, id: doc.id })
			);
		}
	}
	function selectMethod(event: CustomEvent) {
		methodIndex = event.detail.index;
		if (methodIndex !== undefined) {
			methodId = entries[methodIndex][0];
		}
		stage = undefined;
	}

	$: allStages = Object.entries($store.stages.stageIdToStageMap) || [];
	let nameToOptionIndex: { [k: string]: number } = {};
	$: if (allStages.length) {
		allStages.forEach((x, i) => {
			const stageName = x[1].name;
			nameToOptionIndex[stageName] = i;
		});
	}
	function getStageByName(name: string) {
		return allStages[nameToOptionIndex[name]];
	}
	let stage: [string, Stage] | undefined = undefined;
	function stageCallback(event: CustomEvent) {
		stage = getStageByName(event.detail.stage);
	}
	function removeCallback(method: string, stageName: string) {
		if ($store.auth.uid) {
			const stageId = getStageByName(stageName)[0];
			dispatch('methods', method, $store.auth.uid, remove_stage({ method, stage: stageId }));
		}
	}
	function addCallback(method: string, parentStageName: string, stageName: string) {
		if ($store.auth.uid) {
			let parentStageId: string | undefined = undefined;
			if (parentStageName !== 'scrambled') {
				parentStageId = getStageByName(parentStageName)[0];
			}
			const stageId = getStageByName(stageName)[0];
			const doc = { method, parent: parentStageId, stage: stageId };
			if (!parentStageId) {
				delete doc.parent;
			}
			dispatch('methods', method, $store.auth.uid, add_stage(doc));
		}
	}
	let pendingStage = '';
	function renameStage(event: CustomEvent) {
		if (methodIndex !== undefined && stage && $store.auth.uid) {
			const method = entries[methodIndex][0];
			const name = event.detail.stage[1].name;
			if (name !== stage[1].name) {
				dispatch(
					'methods',
					method,
					$store.auth.uid,
					rename_stage({ method, stage: stage[1].name, name })
				);
				pendingStage = name;
			}
		}
	}
	let lastAllStages = allStages;
	$: if (allStages && allStages !== lastAllStages) {
		lastAllStages = allStages;
		if (pendingStage && pendingStage === allStages.slice(-1)[0][1].name) {
			stage = getStageByName(pendingStage);
			pendingStage = '';
		}
	}
	function destroyStage(event: CustomEvent) {
		if (methodIndex !== undefined && stage && $store.auth.uid) {
			const method = entries[methodIndex][0];
			dispatch('methods', method, $store.auth.uid, remove_stage({ method, stage: stage[1].name }));
			stage = undefined;
		}
	}

	onDestroy(() => {
		type MaskMap = { [k: string]: { mask: MaskT } };
		let allMasks: MaskMap = $store.stages.stageIdToStageMap;
		if (Object.keys(allMasks).length === 0) {
			let predefined: { [k: string]: MaskT } = Mask as any;
			let initWith: string[] = Object.keys(Mask).filter((x) => predefined[x].cp !== undefined);
			initWith.forEach(async (maskId) => {
				if ($store.auth.uid) {
					const mask = predefined[maskId];
					const doc = await createMethod('stages', $store.auth.uid);
					const id = doc.id;
					const newStage = new_stage({ id, name: maskId.replace('_mask', ''), mask });
					dispatch('stages', id, $store.auth.uid, newStage);
				}
			});
		}
	});
</script>

<div class="column">
	<div class="row">
		<BoxedList {items} on:destroy={destroy} on:new={create} on:select={selectMethod} />
		{#if methodIndex !== undefined}
			<BoxedStage
				method={entries[methodIndex][0]}
				{stageCallback}
				on:stage={stageCallback}
				{addCallback}
				{removeCallback}
			/>
		{/if}
	</div>
	<div class="row">
		{#if stage}
			<SVGCube {stage} {allStages} on:destroy={destroyStage} on:stage={renameStage} />
		{:else if methodId}
			<AlgSetsEditor {methodId} />
		{/if}
	</div>
</div>

<style>
	.column {
		display: flex;
		flex-direction: column;
		width: 100%;
		align-items: flex-start;
	}
	.row {
		display: flex;
		flex-direction: row;
	}
</style>
