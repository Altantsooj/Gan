<script lang="ts">
	import { dispatch } from '$lib/actionlog';
	import { store } from '$lib/store';
	import { htm_rwm, rrwmu } from '$lib/third_party/onionhoney/Pruner';
	import Textfield from '@smui/textfield';
	import { makeFromToKey, set_moveset } from './methods';
	export let methodId: string = '';

	$: methodName = $store.methods.methodToNameMap[methodId];

	type EdgeDef = { key: { from_id: string; to_id: string }; name: string };
	let stageEdges: EdgeDef[] = [];

	function buildStageEdges(currentNode: string) {
		const stageSucessors = $store.methods.methodToStageMap[methodId][currentNode];
		if (!stageSucessors) {
			console.error({ methodId, currentNode });
			return;
		}
		stageSucessors.forEach((next) => {
			let prefix = '';
			if (currentNode !== 'scrambled')
				prefix = $store.stages.stageIdToStageMap[currentNode].name + '→';
			const nextName = $store.stages.stageIdToStageMap[next].name;
			stageEdges.push({ key: { from_id: currentNode, to_id: next }, name: prefix + nextName });
		});
		stageSucessors.forEach((next) => {
			buildStageEdges(next);
		});
	}
	$: if (methodName) {
		stageEdges = [];
		buildStageEdges('scrambled');
	}

	function getMovesForEdge(edge: EdgeDef) {
		const preset = edge.name.indexOf('fb') !== -1 ? htm_rwm.join(' ') : rrwmu.join(' ');
		return $store.methods.stateFromToMovesMap[makeFromToKey(edge.key)] || preset;
	}
	function edgeChanged(edge: EdgeDef) {
		return (e: CustomEvent) => {
			const target = e.target as HTMLInputElement;
			console.log(target.value);
			if ($store.auth.uid) {
				dispatch(
					'methods',
					methodId,
					$store.auth.uid,
					set_moveset({ ...edge.key, moveset: target.value, method: methodId })
				);
			}
		};
	}
</script>

<div>
	<h2>Define allowed algorithms for {methodName}</h2>
	{#each stageEdges as edge}
		<div class="row">
			<Textfield
				on:change={edgeChanged(edge)}
				value={getMovesForEdge(edge)}
				label="Allowed moves for {edge.name}"
			/>
		</div>
	{/each}
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		width: 600px;
	}
</style>
