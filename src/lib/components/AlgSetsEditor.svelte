<script lang="ts">
	import { dispatch } from '$lib/actionlog';
	import { store } from '$lib/store';
	import { htm_rwm, rrwmu } from '$lib/third_party/onionhoney/Pruner';
	import Textfield from '@smui/textfield';
	import { makeFromToKey, set_algsetname, set_moveset } from './methods';
	export let methodId: string = '';

	$: methodName = $store.methods.methodToNameMap[methodId];

	type EdgeDef = { key: { from_id: string; to_id: string }; name: string };
	let stageEdges: EdgeDef[] = [];

	function rebuildStageEdges() {
		stageEdges = [];
		buildStageEdges('scrambled');
	}
	function buildStageEdges(currentNode: string) {
		const stageSucessors = $store.methods.methodToStageMap[methodId][currentNode];
		if (!stageSucessors) {
			if ($store.stages.stageIdToStageMap[currentNode].name !== 'solved') {
				console.error({
					methodId,
					currentNode,
					name: $store.stages.stageIdToStageMap[currentNode].name
				});
			}
			return;
		}
		stageSucessors.forEach((next) => {
			let prefix = '';
			if (currentNode !== 'scrambled')
				prefix = $store.stages.stageIdToStageMap[currentNode].name + '→';
			const nextName = $store.stages.stageIdToStageMap[next].name;
			const computedName = prefix + nextName;
			const from_id = currentNode;
			const to_id = next;
			const storedName = $store.methods.stateFromToNameMap[makeFromToKey({ from_id, to_id })];
			stageEdges.push({
				key: { from_id: currentNode, to_id: next },
				name: storedName || computedName
			});
		});
		stageSucessors.forEach((next) => {
			buildStageEdges(next);
		});
	}
	$: if (methodName) {
		rebuildStageEdges();
	}

	function getMovesForEdge(edge: EdgeDef) {
		const preset = edge.name.indexOf('fb') !== -1 ? htm_rwm.join(' ') : rrwmu.join(' ');
		return $store.methods.stateFromToMovesMap[makeFromToKey(edge.key)] || preset;
	}
	function edgeChanged(edge: EdgeDef) {
		return (e: CustomEvent) => {
			const target = e.target as HTMLInputElement;
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

	function nameChanged(edge: EdgeDef) {
		return (e: CustomEvent) => {
			const target = e.target as HTMLInputElement;
			if ($store.auth.uid) {
				dispatch(
					'methods',
					methodId,
					$store.auth.uid,
					set_algsetname({ ...edge.key, name: target.value, method: methodId })
				);
			}
		};
	}
	function getNameForEdge(edge: EdgeDef) {
		return edge.name;
	}
	let lastMethods = $store.methods;
	$: if ($store.methods !== lastMethods) {
		lastMethods = $store.methods;
		rebuildStageEdges();
	}
</script>

<div>
	<h2>Define allowed algorithms for {methodName}</h2>
	{#each stageEdges as edge}
		<div class="row">
			<Textfield
				style="width: 150px;margin-right:30px;"
				on:change={nameChanged(edge)}
				value={getNameForEdge(edge)}
				label="Name for {edge.name}"
			/>
			<Textfield
				style="width: 600px"
				on:change={edgeChanged(edge)}
				value={getMovesForEdge(edge)}
				label="Allowed moves for {getNameForEdge(edge)}"
			/>
		</div>
	{/each}
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
	}

	.row {
		flex-direction: row;
	}
</style>
