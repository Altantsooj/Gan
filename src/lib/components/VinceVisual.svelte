<script lang="ts">
	import { TwistyAlgViewer, TwistyPlayer } from 'cubing/twisty';
	import { onMount } from 'svelte';
	import { cube3x3x3 } from 'cubing/puzzles';
	import type { KStateData } from 'cubing/kpuzzle';
	import { Alg, Move } from 'cubing/alg';

	export let alg = "R U R' U'";

	let twistyPlayer: TwistyPlayer | undefined;
	export let playHead = 0;
	export let stickeringOrientation = '';
	export let visualization = 'PG3D';

	let lastAlg = '';
	async function setStickering() {
		if (alg === lastAlg) return;
		lastAlg = alg;
		const regular = '-';
		const dim = 'D';
		const muted = 'I';
		const oriented = '?';

		const cube = await cube3x3x3.kpuzzle();
		const before = cube.startState();
		const after = before.applyAlg(alg);

		function mapping(parr: number[], oarr: number[]) {
			return (i: number) => {
				const p = parr[i];
				const o = oarr[i];
				console.log({ p, o });
				if (p === i) {
					if (o === 0) {
						return false;
					} else {
						return true;
					}
				} else {
					return true;
				}
			};
		}
		function orbit(state: KStateData, orbitName: string) {
			const emap = mapping(state[orbitName].pieces, state[orbitName].orientation);
			return state[orbitName].pieces.map((e, i) => emap(i));
		}

		let eo = orbit(before.stateData, 'EDGES');
		let co = orbit(before.stateData, 'CORNERS');
		let to = orbit(before.stateData, 'CENTERS');
		const parsedAlg = new Alg(alg);
		let next = before;
		Array.from(parsedAlg.childAlgNodes()).map((move) => {
			next = before.applyMove(move as Move);
			const eoo = orbit(next.stateData, 'EDGES');
			const coo = orbit(next.stateData, 'CORNERS');
			const too = orbit(next.stateData, 'CENTERS');
			eo = eo.map((x, i) => x || eoo[i]);
			co = co.map((x, i) => x || coo[i]);
			to = to.map((x, i) => x || too[i]);
		});
		const eoa = orbit(after.stateData, 'EDGES');
		const coa = orbit(after.stateData, 'CORNERS');
		const toa = orbit(after.stateData, 'CENTERS');

		const edges = 'EDGES:' + eo.map((x, i) => (x ? (eoa[i] ? regular : dim) : muted)).join('');
		const corners = 'CORNERS:' + co.map((x, i) => (x ? (coa[i] ? regular : dim) : muted)).join('');
		const centers = 'CENTERS:' + to.map((x, i) => (x ? (toa[i] ? regular : dim) : muted)).join('');
		console.log({ edges, corners, centers });
		if (twistyPlayer)
			twistyPlayer.experimentalStickeringMaskOrbits = `${edges},${corners},${centers}`;
	}

	$: if (alg && twistyPlayer) {
		twistyPlayer.alg = alg;
		setStickering();
	}

	let playerPosition = -1;
	$: if (playHead !== playerPosition) {
		const p = async () => {
			twistyPlayer?.pause();
			const timestampPromise = (async (): Promise<any> => {
				const indexer = await twistyPlayer?.experimentalModel.indexer.get();
				const offset = 250;
				return (indexer?.indexToMoveStartTimestamp(playHead) ?? -offset) + offset;
			})();
			twistyPlayer?.experimentalModel.timestampRequest.set(
				await timestampPromise // TODO
			);
		};
		p();
	}
	onMount(async () => {
		let contentElem = document.querySelector('#twisty-content');
		twistyPlayer = new TwistyPlayer();
		if (contentElem) {
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = visualization as any;
			const model = twistyPlayer.experimentalModel;
			model.currentMoveInfo.addFreshListener((currentMoveInfo: any) => {
				playHead = currentMoveInfo.stateIndex;
				playerPosition = playHead;
			});
			twistyPlayer.alg = alg;
			twistyPlayer.tempoScale = 4;
			twistyPlayer.backView = 'side-by-side';
			twistyPlayer.hintFacelets = 'none';
			twistyPlayer.id = 'vince';
			const view = new TwistyAlgViewer({ twistyPlayer });
			contentElem.appendChild(view);
			contentElem.appendChild(twistyPlayer);
		}
	});
</script>

<div id="twisty-content" />

<style>
	div {
		text-align: -webkit-center;
	}

	:global(.twisty-alg-move) {
		font-family: Roboto, sans-serif;
		font-size: 32px;
		font-weight: bold;
		padding: 4px;
		margin-right: 8px;
	}
</style>
