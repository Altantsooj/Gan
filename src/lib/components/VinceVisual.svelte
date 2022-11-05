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
		const parsedAlg = new Alg(alg).expand();
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

	import {
		CircleGeometry,
		MeshStandardMaterial,
		BoxGeometry,
		DoubleSide,
		MeshPhongMaterial,
		RGBADepthPacking,
		Color,
		MeshBasicMaterial
	} from 'three';
	import { DEG2RAD } from 'three/src/math/MathUtils';
	import {
		AmbientLight,
		Canvas,
		DirectionalLight,
		Group,
		HemisphereLight,
		Mesh,
		OrbitControls,
		PerspectiveCamera
	} from '@threlte/core';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { ColorScheme } from '$lib/third_party/onionhoney/CubeLib';

	const scale = spring(1);

	interface CubieCoord {
		x: number;
		y: number;
		z: number;
	}
	const cubies = [-1, 0, 1];
	//const cubies = [ 0];
	function createBoxGeometry({ x, y, z }: CubieCoord) {
		const s = 0.995;
		const ret = new BoxGeometry(s, s, s);
		ret.translate(x, y, z);
		return ret;
	}
	const colors = {
		white: new Color(0xffffff).convertSRGBToLinear(),
		orange: new Color(0xf08733).convertSRGBToLinear(),
		green: new Color(0x00ff00).convertSRGBToLinear(),
		red: new Color(0xff0000).convertSRGBToLinear(),
		blue: new Color(0x0000ff).convertSRGBToLinear(),
		yellow: new Color(0xffff00).convertLinearToSRGB(),
		grey: '#444444',
		black: '#050505'
	};
	function getMaterial({ x, y, z }: CubieCoord) {
		const U = new MeshPhongMaterial({ color: colors.white });
		const D = new MeshPhongMaterial({ color: colors.yellow });
		const L = new MeshPhongMaterial({ color: colors.orange });
		const R = new MeshPhongMaterial({ color: colors.red });
		const F = new MeshPhongMaterial({ color: colors.green });
		const B = new MeshPhongMaterial({ color: colors.blue });
		const black = new MeshPhongMaterial({ color: colors.black });
		return [R, L, U, D, F, B].map((c, i) => {
			if (x === 0 && i < 2) {
				return black;
			}
			if (y === 0 && (i === 2 || i === 3)) {
				return black;
			}
			if (z === 0 && i > 3) {
				return black;
			}
			if (x === -1 && i === 0) {
				return black;
			}
			if (y === -1 && i === 2) {
				return black;
			}
			if (z === -1 && i === 4) {
				return black;
			}
			if (x === 1 && i === 1) {
				return black;
			}
			if (y === 1 && i === 3) {
				return black;
			}
			if (z === 1 && i === 5) {
				return black;
			}
			return c;
		});
	}

	let count = 0;
	let rotX = tweened(0, { duration: 800, easing: cubicOut });
	const tick = () => {
		if (count % 100 === 0) $rotX += Math.PI / 2;
		count++;
		handle = window.requestAnimationFrame(tick);
	};
	let handle;
	tick();
	$rotX = Math.PI / 2;
</script>

<div id="twisty-content">
	<div class="threlte-cube-container">
		<Canvas flat={true}>
			<PerspectiveCamera position={{ x: 10, y: 10, z: 10 }} fov={24}>
				<OrbitControls autoRotate={false} enableZoom={false} target={{ y: 0.5 }} />
			</PerspectiveCamera>

			<DirectionalLight color={'white'} position={{ x: -15, y: 45, z: 20 }} intensity={0.8} />
			<DirectionalLight color={'white'} position={{ x: 15, y: 45, z: -20 }} intensity={0.8} />
			<HemisphereLight skyColor={colors.white} groundColor={colors.grey} intensity={0.4} />
			<AmbientLight color={'white'} intensity={0.4} />

			<!-- Cube -->
			{#each cubies as x}
				{#each cubies as y}
					{#each cubies as z}
						<Mesh
							rotation={{ y: y === 1 ? $rotX : 0 }}
							geometry={createBoxGeometry({ x, y, z })}
							material={getMaterial({ x, y, z })}
						/>
					{/each}
				{/each}
			{/each}
		</Canvas>
	</div>
</div>

<style>
	div {
		text-align: -webkit-center;
	}

	.threlte-cube-container {
		width: 800px;
		height: 800px;
		border: 4px solid green;
	}

	:global(.twisty-alg-move) {
		font-family: Roboto, sans-serif;
		font-size: 32px;
		font-weight: bold;
		padding: 4px;
		margin-right: 4px;
		margin-left: 1px;
	}

	:global(.twisty-alg-alg) {
	}

	:global(.twisty-alg-grouping) {
		font-family: Roboto, sans-serif;
		font-size: 32px;
		font-weight: bold;
		padding: 2px;
		margin-left: -4px;
	}
</style>
