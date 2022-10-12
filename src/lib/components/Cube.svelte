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

		function stringify(
			perm: number[],
			cubies: number[],
			mask: number[],
			prior: number[] | undefined
		) {
			const ret: string[] = [];
			for (let j = 0; j < perm.length; ++j) {
				const i = cubies[perm[j]];
				if (mask[i] === 1) {
					if (prior && prior[i] === 1) ret.push(dim);
					else ret.push(regular);
				} else {
					ret.push(muted);
				}
			}
			return ret.join('');
		}
		//[UF, UL, UB, UR, DF, DL, DB, DR, FL, BL, BR, FR];
		//[UF, UR, UB, UL, DF, DR, DB, DL, FR, FL, BR, BL];
		const edgePerm = [0, 3, 2, 1, 4, 7, 6, 5, 11, 8, 10, 9];
		const edges =
			'EDGES:' + stringify(edgePerm, cubies.ep, mask.ep, priorMask ? priorMask.ep : undefined);

		//  0 .  1 .  2 .  3 .  4 .  5 .  6 .  7
		//[ULF, UBL, URB, UFR, DFL, DLB, DBR, DRF];
		//[UFR, URB, UBL, ULF, DRF, DFL, DLB, DBR
		const cornerPerm: number[] = [3, 2, 1, 0, 7, 4, 5, 6];
		const corners =
			'CORNERS:' + stringify(cornerPerm, cubies.cp, mask.cp, priorMask ? priorMask.cp : undefined);

		//[0, 1, 2, 3, 4, 5];
		//[U, D, F, B, L, R];
		//[U, L, F, R, B, D
		const centerPerm = [0, 4, 2, 5, 3, 1];
		const centers =
			'CENTERS:' +
			stringify(
				centerPerm,
				cubies.tp,
				mask.tp || [1, 1, 1, 1, 1, 1],
				priorMask && priorMask.tp ? priorMask.tp : undefined
			);

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

	let playerPosition = -1;
	$: if (playHead !== playerPosition) {
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
			model.currentMoveInfo.addFreshListener((currentMoveInfo: any) => {
				playHead = currentMoveInfo.stateIndex;
				playerPosition = playHead;
			});
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
