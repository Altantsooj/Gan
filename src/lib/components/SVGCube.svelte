<script lang="ts">
	import { Mask, type MaskT } from '$lib/third_party/onionhoney/CubeLib';
	import { onMount } from 'svelte';
	import { Cube, Facelet } from './SVGCube';
	import Autocomplete from '@smui-extra/autocomplete';
	import { createEventDispatcher } from 'svelte';
	import { store } from '$lib/store';
	import { delete_stage, new_stage, set_state } from './stages';
	import Button from '@smui/button';

	const dispatch = createEventDispatcher();

	const cornerPerm: number[] = [3, 2, 1, 0, 7, 4, 5, 6];
	const edgePerm = [0, 3, 2, 1, 4, 7, 6, 5, 11, 8, 10, 9];
	const centerPerm = [0, 4, 2, 5, 3, 1];
	let mask = Mask.copy(Mask.solved_mask);
	function clickCallback(facelet: Facelet) {
		let oriented: boolean | undefined = undefined;
		let positioned: boolean = true;
		let state = 0;
		let index = 0;
		const orbit = facelet.type;
		if (facelet.type === 'CORNERS') {
			const c = cornerPerm[facelet.position];
			state = (mask.cp[c] * 2 + (mask.co ? mask.co[c] : mask.cp[c]) + 1) % 4;
			oriented = mask.co ? mask.co[c] !== 0 : undefined;
			index = c;
		} else if (facelet.type === 'EDGES') {
			const e = edgePerm[facelet.position];
			state = (mask.ep[e] * 2 + (mask.eo ? mask.eo[e] : mask.ep[e]) + 1) % 4;
			oriented = mask.eo ? mask.eo[e] !== 0 : undefined;
			index = e;
		} else {
			const t = centerPerm[facelet.position];
			if (!mask.tp) {
				state = 0;
			} else {
				state = mask.tp[t] ? 0 : 2;
			}
			index = t;
		}
		if ((state & 0x01) !== 0 && oriented !== undefined) {
			oriented = true;
		}
		if ((state & 0x01) === 0) {
			oriented = false;
		}
		oriented = state & 0x01 ? true : false;
		positioned = (state & 0x02) >> 1 ? true : false;
		if (stage) {
			const setState = set_state({ stage, orbit, index, oriented, positioned });
			store.dispatch(setState);
		}
	}
	let svgCube = new Cube(clickCallback);

	type MaskMap = { [k: string]: { mask: MaskT } };
	let allMasks: MaskMap = $store.stages.stageIdToStageMap;
	if (Object.keys(allMasks).length === 0) {
		let predefined: { [k: string]: MaskT } = Mask as any;
		let initWith: string[] = Object.keys(Mask).filter((x) => predefined[x].cp !== undefined);
		initWith.forEach((maskId) => {
			const mask = predefined[maskId];
			const newStage = new_stage({ stage: maskId.replace('_mask', ''), mask });
			store.dispatch(newStage);
		});
	}
	let hardcodedMasks: string[] = Object.keys($store.stages.stageIdToStageMap);
	async function displayMask(mask: MaskT) {
		await svgCube.loadPuzzle();
		for (let i = 0; i < mask.cp.length; ++i) {
			const c = cornerPerm[i];
			const state = mask.cp[c] * 2 + (mask.co ? mask.co[c] : mask.cp[c]);
			const facelet = svgCube.getFaceletByOrbit('CORNERS', i);
			svgCube.setState(state, facelet);
		}
		for (let i = 0; i < mask.ep.length; ++i) {
			const e = edgePerm[i];
			const state = mask.ep[e] * 2 + (mask.eo ? mask.eo[e] : mask.ep[e]);
			const facelet = svgCube.getFaceletByOrbit('EDGES', i);
			svgCube.setState(state, facelet);
		}
		const tp = mask.tp ? mask.tp : [1, 1, 1, 1, 1, 1];
		for (let i = 0; i < tp.length; ++i) {
			const t = centerPerm[i];
			const state = tp[t] * 2 + tp[t];
			const facelet = svgCube.getFaceletByOrbit('CENTERS', i);
			svgCube.setState(state, facelet);
		}
	}
	onMount(async () => {
		displayMask(mask);
	});
	export let stage: string | undefined = undefined;
	let copied: string | undefined;
	let index = -1;
	$: if (stage && $store.stages.stageIdToStageMap[stage]) {
		mask = Mask.copy($store.stages.stageIdToStageMap[stage].mask);
		displayMask(mask);
		if (copied !== stage) {
			copied = stage;
		}
	}

	$: if (stage && hardcodedMasks.indexOf(stage) === -1) {
		if (index === -1) {
			index = hardcodedMasks.length;
			hardcodedMasks.push(stage);
		} else {
			hardcodedMasks[index] = stage;
		}
		dispatch('stage', { stage });
	}
	$: if (stage && hardcodedMasks.indexOf(stage) !== index) {
		index = -1;
	}
	let oldStage = '';
	$: if (stage && stage !== oldStage) {
		oldStage = stage;
		dispatch('stage', { stage });
	}

	function newStage() {
		let name = 'untitled';
		let count = 0;
		while ($store.stages.stageIdToStageMap[name]) {
			count++;
			name = `untitled_${count}`;
		}
		store.dispatch(new_stage({ stage: name, mask: Mask.solved_mask }));
		stage = name;
	}
	function duplicateStage() {
		const root = stage?.replaceAll('copy_of_', '') || '';
		let name = 'copy_of_' + root;
		let count = 0;
		while ($store.stages.stageIdToStageMap[name]) {
			count++;
			const regex = /_[0-9]*$/;
			name = `copy_of_${root.replace(regex, '')}_${count}`;
		}
		store.dispatch(new_stage({ stage: name, mask }));
		stage = name;
	}
	function destroyStage() {
		if (stage) {
			store.dispatch(delete_stage(stage));
			dispatch('destroy', { stage });
		}
	}
</script>

<div class="container">
	<div id="puzzle" />
	<div class="column">
		<Autocomplete
			combobox
			options={hardcodedMasks}
			bind:value={stage}
			bind:text={stage}
			label="Stage"
		/>
		<Button on:click={newStage}>New Stage</Button>
		<Button on:click={duplicateStage}>Duplicate</Button>
		<Button on:click={destroyStage}>Delete</Button>
	</div>
</div>

<style>
	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.container {
		display: flex;
		width: 100%;
	}

	#puzzle {
		width: 50%;
		margin-top: 20px;
	}

	#puzzles {
		margin-top: 56px;
	}

	#mode {
		margin-top: 15px;
	}

	.panel {
		width: 50%;
		padding: 20px;
	}

	h1 {
		margin: 0;
	}
</style>
