<script lang="ts">
	import { create, dispatch as dispatchToFirebase } from '$lib/actionlog';
	import { store } from '$lib/store';
	import { Mask, type MaskT } from '$lib/third_party/onionhoney/CubeLib';
	import Autocomplete from '@smui-extra/autocomplete';
	import Checkbox from '@smui/checkbox';
	import FormField from '@smui/form-field';
	import Button, { Label } from '@smui/button';
	import Dialog, { Actions, Content, Title } from '@smui/dialog';
	import { Text } from '@smui/list';
	import Textfield from '@smui/textfield';
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		delete_stage,
		new_stage,
		set_free_face,
		set_frozen_face,
		set_state,
		use_orientations,
		type Stage
	} from './stages';
	import { Cube, Facelet } from './SVGCube';

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
		if (stage && $store.auth.uid) {
			const id = stage[0];
			dispatchToFirebase(
				'stages',
				id,
				$store.auth.uid,
				set_state({ id, orbit, index, oriented, positioned })
			);
		}
	}
	let svgCube = new Cube(clickCallback);

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
	async function redisplay() {
		displayMask(mask);
		if (stage) {
			cnChecked = $store.stages.stageIdToStageMap[stage[0]].orientations.length > 1;
			freeFace = $store.stages.stageIdToStageMap[stage[0]].free_face || '';
			frozenFace = $store.stages.stageIdToStageMap[stage[0]].frozen_face || '';
		}
	}
	onMount(async () => {
		redisplay();
	});
	export let allStages: [string, Stage][] = [];
	export let stage: [string, Stage] | undefined = undefined;
	$: text = '';
	let index = -1;
	$: if (stage && $store.stages.stageIdToStageMap[stage[0]]) {
		stage[1] = $store.stages.stageIdToStageMap[stage[0]];
		mask = Mask.copy(stage[1].mask);
		redisplay();
	}

	let oldStage: [string, Stage] | undefined = undefined;
	$: if (stage && stage !== oldStage) {
		oldStage = stage;
		dispatch('stage', { stage });
	}

	async function newStage() {
		if ($store.auth.uid) {
			let name = newStageName || 'untitled';
			let count = 0;
			const usedNames: { [k: string]: boolean } = {};
			Object.keys($store.stages.stageIdToStageMap).forEach((id) => {
				const name = $store.stages.stageIdToStageMap[id].name;
				usedNames[name] = true;
			});
			while (usedNames[name]) {
				count++;
				name = `untitled_${count}`;
			}
			const doc = await create('stages', $store.auth.uid);
			const id = doc.id;
			dispatchToFirebase(
				'stages',
				id,
				$store.auth.uid,
				new_stage({ id, name, mask: Mask.solved_mask })
			);
			const nextOne: [string, Stage] = [id, { name, mask: Mask.copy(mask), orientations: [] }];
			dispatch('stage', { stage: nextOne });
		}
	}
	async function duplicateStage() {
		if ($store.auth.uid && mask) {
			let name = newStageName || 'copy_';
			const usedNames: { [k: string]: boolean } = {};
			Object.keys($store.stages.stageIdToStageMap).forEach((id) => {
				const name = $store.stages.stageIdToStageMap[id].name;
				usedNames[name] = true;
			});
			let count = 0;
			while (usedNames[name]) {
				count++;
				const regex = /_[0-9]*$/;
				name = `${name.replace(regex, '')}_${count}`;
			}
			const doc = await create('stages', $store.auth.uid);
			const id = doc.id;
			dispatchToFirebase(
				'stages',
				id,
				$store.auth.uid,
				new_stage({ id, name, mask: Mask.copy(mask) })
			);
			const nextOne: [string, Stage] = [id, { name, mask: Mask.copy(mask), orientations: [] }];
			dispatch('stage', { stage: nextOne });
		}
	}
	function destroyStage() {
		if (stage && $store.auth.uid) {
			const id = stage[0];
			dispatchToFirebase('stages', id, $store.auth.uid, delete_stage(id));
			dispatch('destroy', { stage });
		}
	}

	let newStageName: string = '';
	let dialogOpen = false;
	let unusedText = '';
	/*
	$: if (stage && (stage !== oldStage || !unusedText)) {
		unusedText = stage[1].name;
	}
	*/
	let lastInput: HTMLInputElement | undefined = undefined;
	function handleInput(e: CustomEvent) {
		lastInput = e.target as HTMLInputElement;
		unusedText = lastInput.value;
	}

	let cnChecked = false;
	let freeFace = '';
	let frozenFace = '';
	let lastOrientationSpec = false;
	let lastFreeFace = '';
	let lastFrozenFace = '';

	$: if (stage && cnChecked !== lastOrientationSpec) {
		if ($store.auth.uid) {
			lastOrientationSpec = cnChecked;
			const id = stage[0];
			dispatchToFirebase(
				'stages',
				id,
				$store.auth.uid,
				use_orientations({ id, orientation_spec: cnChecked ? 'cn' : '' })
			);
		}
	}

	$: if (stage && freeFace !== lastFreeFace) {
		if ($store.auth.uid) {
			lastFreeFace = freeFace;
			const id = stage[0];
			dispatchToFirebase('stages', id, $store.auth.uid, set_free_face({ id, free_face: freeFace }));
		}
	}
	$: if (stage && frozenFace !== lastFrozenFace) {
		if ($store.auth.uid) {
			lastFrozenFace = frozenFace;
			const id = stage[0];
			dispatchToFirebase(
				'stages',
				id,
				$store.auth.uid,
				set_frozen_face({ id, frozen_face: frozenFace })
			);
		}
	}
</script>

<div class="container">
	<div id="puzzle" />
	<div class="column">
		{#if allStages.length > 0}
			<Autocomplete
				options={allStages}
				getOptionLabel={(option) => option && option.length === 2 && option[1].name}
				bind:value={stage}
				on:input={handleInput}
				label="Stage"
				noMatchesActionDisabled={false}
				on:SMUIAutocomplete:noMatchesAction={(e) => {
					newStageName = unusedText;
					if (lastInput) lastInput.blur();
					dialogOpen = true;
				}}
			>
				<div slot="no-matches">
					<Text>Add stage</Text>
				</div>
			</Autocomplete>
		{/if}
		<Button on:click={() => (dialogOpen = true)}>New Stage</Button>
		<Button on:click={destroyStage}>Delete</Button>
		<div class="row">
			<FormField
				><Checkbox bind:checked={cnChecked} /><span slot="label">Colour Neutral</span></FormField
			>
		</div>
		<Textfield bind:value={freeFace} label="Free Face" />
		<Textfield bind:value={frozenFace} label="Frozen Face" />
	</div>
	<Dialog
		bind:open={dialogOpen}
		aria-labelledby="autocomplete-dialog-title"
		aria-describedby="autocomplete-dialog-content"
	>
		<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
		<Title id="autocomplete-dialog-title">New Stage</Title>
		<Content id="autocomplete-dialog-content">
			<Textfield bind:value={newStageName} label="Name" />
		</Content>
		<Actions>
			<Button>
				<Label>Cancel</Label>
			</Button>
			<Button on:click={duplicateStage}>
				<Label>Duplicate</Label>
			</Button>
			<Button on:click={newStage}>
				<Label>New</Label>
			</Button>
		</Actions>
	</Dialog>
</div>

<style>
	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}
	.container {
		display: flex;
		width: 600px;
		flex-grow: 1;
		justify-content: center;
		flex-direction: row;
	}

	#puzzle {
		width: 50%;
		margin-top: 20px;
	}
</style>
