<script lang="ts">
	import { page } from '$app/stores';
	import { add_solve } from '$lib/components/solves';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import {
		collectionGroup,
		documentId,
		onSnapshot,
		orderBy,
		query,
		where
	} from 'firebase/firestore';
	import Solve from '$lib/components/Solve.svelte';

	$: solveId = $page.url.searchParams.get('solveId') || undefined;
	$: methodId = $page.url.searchParams.get('methodId') || undefined;

	function getSolve(solveId: string) {
		const solves = collectionGroup(firebase.firestore, 'solves');
		const unsub = onSnapshot(
			query(solves, where('solveId', '==', solveId), orderBy('timestamp')),
			(q) => {
				q.docChanges().forEach((change) => {
					const doc = change.doc;
					store.dispatch(
						add_solve({
							solveId: doc.id,
							scramble: doc.data().scramble,
							moves: doc.data().moves,
							time: doc.data().time
						})
					);
				});
				unsub();
			}
		);
	}

	$: if (solveId && solveId.length > 2) {
		getSolve(solveId);
	}

	$: solve = solveId ? $store.solves.solveIdToSolve[solveId] : undefined;

	$: methodKnown =
		methodId && $store.methods.methodToStageMap[methodId] && stagesExist(methodId, 'scrambled');

	function stagesExist(methodId: string, currentStage: string) {
		let stage = $store.stages.stageIdToStageMap[currentStage];
		if (!stage && currentStage !== 'scrambled') return false;
		let next = $store.methods.methodToStageMap[methodId][currentStage];
		if (next === undefined) {
			return true;
		}
		for (let i = 0; i < next.length; ++i) {
			if (!stagesExist(methodId, next[i])) {
				return false;
			}
		}
		return true;
	}

	export let data;
	const optimizer = data.optimizer;
</script>

{#if methodKnown}
	<Solve {solveId} {methodId} {optimizer} />
{:else}
	Loading methodId {methodId}...
{/if}
