<script lang="ts">
	import { CubieCube, Mask } from '$lib/third_party/onionhoney/CubeLib';
	import type { MaskT } from '$lib/third_party/onionhoney/CubeLib';
	import { Alg } from 'cubing/alg';
	import { TwistyPlayer } from 'cubing/twisty';
	import { onMount } from 'svelte';

	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	export let controlPanel = 'none';
	export let scramble = '';
	export let solve = '';
	export let playHead = 0;
	export let stickering = '';
	export let stickeringOrientation = '';
	import { cube3x3x3 } from 'cubing/puzzles';

	async function setStickersString(mask: MaskT) {
		const cubies = new CubieCube().apply(stickeringOrientation);
		const regular = '-';
		const muted = 'I';

		let edges = 'EDGES:';
		//[UF, UL, UB, UR, DF, DL, DB, DR, FL, BL, BR, FR];
		//[UF, UR, UB, UL, DF, DR, DB, DL, FR, FL, BR, BL];
		const edgePerm = [0, 3, 2, 1, 4, 7, 6, 5, 11, 8, 10, 9];

		for (let j = 0; j < edgePerm.length; ++j) {
			const i = cubies.ep[edgePerm[j]];
			if (mask.ep[i] === 1) {
				edges += regular;
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
				corners += regular;
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
				centers += regular;
			} else {
				centers += muted;
			}
		}

		twistyPlayer.experimentalStickeringMaskOrbits = `${edges},${corners},${centers}`;
	}
	async function setStickersKPuzzle(mask: MaskT) {
		const regular = 'regular';
		const muted = 'dim';
		const UF = [regular, regular];
		const UR = [regular, regular];
		const UB = [regular, regular];
		const UL = [regular, regular];
		const DF = [regular, regular];
		const DR = [regular, regular];
		const DB = [regular, regular];
		const DL = [regular, regular];
		const FR = [regular, regular];
		const FL = [regular, regular];
		const BR = [regular, regular];
		const BL = [regular, regular];
		const edgeOrder = [UF, UL, UB, UR, DF, DL, DB, DR, FL, BL, BR, FR];
		const UFR = [regular, regular, regular];
		const URB = [regular, regular, regular];
		const UBL = [regular, regular, regular];
		const ULF = [regular, regular, regular];
		const DRF = [regular, regular, regular];
		const DFL = [regular, regular, regular];
		const DLB = [regular, regular, regular];
		const DBR = [regular, regular, regular];
		const cornerOrder = [ULF, UBL, URB, UFR, DFL, DLB, DBR, DRF];
		const U = [regular];
		const L = [regular];
		const F = [regular];
		const R = [regular];
		const B = [regular];
		const D = [regular];
		const centerOrder = [U, D, F, B, L, R];
		const json = {
			orbits: {
				EDGES: {
					pieces: [
						{ facelets: UF },
						{ facelets: UR },
						{ facelets: UB },
						{ facelets: UL },
						{ facelets: DF },
						{ facelets: DR },
						{ facelets: DB },
						{ facelets: DL },
						{ facelets: FR },
						{ facelets: FL },
						{ facelets: BR },
						{ facelets: BL }
					]
				},
				CORNERS: {
					pieces: [
						{ facelets: UFR },
						{ facelets: URB },
						{ facelets: UBL },
						{ facelets: ULF },
						{ facelets: DRF },
						{ facelets: DFL },
						{ facelets: DLB },
						{ facelets: DBR }
					]
				},
				CENTERS: {
					pieces: [
						{ facelets: U },
						{ facelets: L },
						{ facelets: F },
						{ facelets: R },
						{ facelets: B },
						{ facelets: D }
					]
				}
			}
		};

		for (let i = 0; i < edgeOrder.length; ++i) {
			if (mask.ep[i] === 1) {
				edgeOrder[i][0] = regular;
				edgeOrder[i][1] = regular;
			} else {
				edgeOrder[i][0] = muted;
				edgeOrder[i][1] = muted;
			}
		}

		for (let i = 0; i < cornerOrder.length; ++i) {
			if (mask.cp[i] === 1) {
				cornerOrder[i][0] = regular;
				cornerOrder[i][1] = regular;
				cornerOrder[i][2] = regular;
			} else {
				cornerOrder[i][0] = muted;
				cornerOrder[i][1] = muted;
				cornerOrder[i][2] = muted;
			}
		}

		for (let i = 0; i < centerOrder.length; ++i) {
			if (!mask.tp || mask.tp[i] === 1) {
				centerOrder[i][0] = regular;
			} else {
				centerOrder[i][0] = muted;
			}
		}
		function transformMask(mask, transformation) {
			const newMask = { orbits: {} };
			for (const [orbit, orbitMask] of Object.entries(mask.orbits)) {
				const newOrbitMask = { pieces: [] };
				const { numPieces, numOrientations } = transformation.kpuzzle.definition.orbits[orbit];
				for (let i = 0; i < numPieces; i++) {
					const perm = transformation.transformationData[orbit].permutation[i];
					const ori = transformation.transformationData[orbit].orientation[i];
					let facelets = orbitMask.pieces[perm].facelets.slice(0, numOrientations);
					facelets = facelets.slice(ori).concat(facelets.slice(0, ori));
					newOrbitMask.pieces.push({ facelets });
				}
				newMask.orbits[orbit] = newOrbitMask;
			}
			return newMask;
		}
		const kpuzzle = await cube3x3x3.kpuzzle();

		twistyPlayer.experimentalStickeringMaskOrbits = transformMask(
			json,
			kpuzzle.algToTransformation(stickeringOrientation)
		);
	}
	async function setStickers(mask: MaskT) {
		setStickersKPuzzle(mask);
		//setStickersString(mask);
	}

	$: if (stickering) {
		console.log('RESET STICKERING to: ', stickering);
		const stageToMask: { [key: string]: MaskT } = {};
		// disable for now; rotations don't work.
		stageToMask['fb'] = Mask.fb_mask;
		stageToMask['ss'] = Mask.sb_mask;
		stageToMask['sp'] = Mask.sb_mask;
		stageToMask['cmll'] = Mask.lse_mask;
		stageToMask['lse'] = Mask.solved_mask;
		if (stageToMask[stickering]) {
			setStickers(stageToMask[stickering]);
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
			//twistyPlayer.visualization = 'PG3D';
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
