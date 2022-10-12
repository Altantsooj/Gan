<script lang="ts">
	import { CubieCube, Mask } from '$lib/third_party/onionhoney/CubeLib';
	import type { MaskT } from '$lib/third_party/onionhoney/CubeLib';
	import { TwistyPlayer } from 'cubing/twisty';
	import { onMount } from 'svelte';

	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	export let controlPanel = 'none';
	export let scramble = '';
	export let solve = '';
	export let playHead = 0;
	export let stickering = '';
	export let stickeringOrientation = '';

	async function setStickersString(mask: MaskT, priorMask?: MaskT) {
		const cubies = new CubieCube().apply(stickeringOrientation);
		const regular = '-';
		const dim = 'D';
		const muted = 'I';

		let edges = 'EDGES:';
		//[UF, UL, UB, UR, DF, DL, DB, DR, FL, BL, BR, FR];
		//[UF, UR, UB, UL, DF, DR, DB, DL, FR, FL, BR, BL];
		const edgePerm = [0, 3, 2, 1, 4, 7, 6, 5, 11, 8, 10, 9];

		for (let j = 0; j < edgePerm.length; ++j) {
			const i = cubies.ep[edgePerm[j]];
			if (mask.ep[i] === 1) {
				if (priorMask && priorMask.ep[i] === 1) edges += dim;
				else edges += regular;
			} else {
				edges += muted;
			}
		}

		let corners = 'CORNERS:';
		//  0 .  1 .  2 .  3 .  4 .  5 .  6 .  7
		//[ULF, UBL, URB, UFR, DFL, DLB, DBR, DRF];
		//[UFR, URB, UBL, ULF, DRF, DFL, DLB, DBR
		const cornerPerm = [3, 2, 1, 0, 7, 4, 5, 6];
		for (let j = 0; j < cornerPerm.length; ++j) {
			const i = cubies.cp[cornerPerm[j]];
			if (mask.cp[i] === 1) {
				if (priorMask && priorMask.cp[i] === 1) corners += dim;
				else corners += regular;
			} else {
				corners += muted;
			}
		}

		let centers = 'CENTERS:';
		//[0, 1, 2, 3, 4, 5];
		//[U, D, F, B, L, R];
		//[U, L, F, R, B, D
		const centerPerm = [0, 4, 2, 5, 3, 1];
		for (let j = 0; j < centerPerm.length; ++j) {
			const i = cubies.tp[centerPerm[j]];
			if (!mask.tp || mask.tp[i] === 1) {
				if (priorMask && priorMask.tp && priorMask.tp[i] === 1) centers += dim;
				else centers += regular;
			} else {
				centers += muted;
			}
		}

		twistyPlayer.experimentalStickeringMaskOrbits = `${edges},${corners},${centers}`;
	}

	async function setStickers(mask: MaskT, priorMask?: MaskT) {
		setStickersString(mask, priorMask);
	}

	$: if (stickering) {
		console.log('RESET STICKERING to: ', stickering);
		const stageToMask: { [key: string]: MaskT } = {};
		stageToMask['fb'] = Mask.fb_mask;
		stageToMask['ss'] = Mask.sb_mask;
		stageToMask['sp'] = Mask.sb_mask;
		stageToMask['cmll'] = Mask.lse_mask;
		stageToMask['lse'] = Mask.solved_mask;
		stageToMask['pre_ss'] = stageToMask['fb'];
		stageToMask['pre_sp'] = stageToMask['fb'];
		stageToMask['pre_cmll'] = stageToMask['sp'];
		stageToMask['pre_lse'] = stageToMask['cmll'];
		if (stageToMask[stickering]) {
			setStickers(stageToMask[stickering], stageToMask['pre_' + stickering]);
		} else {
			setStickers(Mask.solved_mask);
		}
	} else {
		console.log('CLEAR STICKERS');
		setStickers(Mask.solved_mask);
	}

	$: if (scramble) {
		twistyPlayer.experimentalSetupAlg = scramble;
	}
	$: if (solve) {
		twistyPlayer.alg = solve;
	}

	$: if (playHead >= 0) {
		const p = async () => {
			console.log({ playHead });
			twistyPlayer.pause();
			const timestampPromise = (async (): Promise<any> => {
				const indexer = await twistyPlayer.experimentalModel.indexer.get();
				const offset = 250;
				return (indexer.indexToMoveStartTimestamp(playHead) ?? -offset) + offset;
			})();
			twistyPlayer.experimentalModel.timestampRequest.set(
				await timestampPromise // TODO
			);
		};
		p();
	}
	onMount(async () => {
		let contentElem = document.querySelector('#twisty-content');
		if (contentElem) {
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = 'PG3D';
			if (controlPanel === 'none') {
				twistyPlayer.controlPanel = 'none';
			}
			const model = twistyPlayer.experimentalModel;
			twistyPlayer.experimentalSetupAlg = scramble;
			twistyPlayer.alg = solve;
			twistyPlayer.tempoScale = 4;
			twistyPlayer.backView = 'top-right';
			twistyPlayer.hintFacelets = 'none';
			contentElem.appendChild(twistyPlayer);
		}
	});
</script>

<div id="twisty-content" />

<style>
	div {
		text-align: -webkit-center;
	}
</style>
