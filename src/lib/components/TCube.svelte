<script lang="ts">
	import { BoxGeometry, MeshPhongMaterial, Color, Quaternion, Vector3, Material } from 'three';
	import {
		AmbientLight,
		Canvas,
		DirectionalLight,
		HemisphereLight,
		Mesh,
		OrbitControls,
		PerspectiveCamera
	} from '@threlte/core';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Unsubscriber } from 'svelte/store';
	import { CubieCube, Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
	import FrameLoop from './FrameLoop.svelte';

	export let alg = '';
	export let playHead: number = 0;

	interface CubieCoord {
		x: number;
		y: number;
		z: number;
	}
	const cubies = [-1, 0, 1];
	function createBoxGeometry({ x, y, z }: CubieCoord, dims?: CubieCoord): BoxGeometry {
		const i = address({ x, y, z });
		if (!dims && cubiesInfo[i].mesh) {
			return cubiesInfo[i].mesh?.geometry as BoxGeometry;
		}
		const s = 1.0; //0.95; //0.985;
		const d = dims ? dims : { x: s, y: s, z: s };
		const ret = new BoxGeometry(d.x, d.y, d.z);
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
	function getMaterial({ x, y, z }: CubieCoord): Material[] {
		const i = address({ x, y, z });
		if (cubiesInfo[i].mesh) {
			return cubiesInfo[i].mesh?.material as Material[];
		}
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
	type AnimationStore = ReturnType<typeof tweened<number>> & { face: string; unsub?: Unsubscriber };
	let tOff: AnimationStore = { ...tweened(0, { duration: 300, easing: cubicOut }), face: 'L' };

	interface CubieInfo {
		position: CubieCoord;
		size: CubieCoord;
		rotation: CubieCoord;
		mesh?: THREE.Mesh;
		source?: Quaternion;
		destination?: Quaternion;
		translation: Vector3;
	}
	let cubiesInfo: CubieInfo[] = cubies
		.map((x) =>
			cubies.map((y) =>
				cubies.map((z) => {
					return {
						position: { x, y, z },
						size: { x: 1, y: 1, z: 1 },
						rotation: { x: 0, y: 0, z: 0 },
						translation: new Vector3(0, 0, 0)
					};
				})
			)
		)
		.flat()
		.flat();
	let meshes: (THREE.Mesh | undefined)[] = Array.from({ length: 3 * 3 * 3 }, () => {
		return undefined;
	});
	function address({ x, y, z }: CubieCoord) {
		return (x + 1) * 3 * 3 + (y + 1) * 3 + (z + 1);
	}
	const cornerAddresses = [
		{ x: -1, z: 1, y: 1 }, // UFL
		{ x: -1, z: -1, y: 1 }, // ULB
		{ x: 1, z: -1, y: 1 }, // UBR
		{ x: 1, z: 1, y: 1 }, // URF
		{ x: -1, z: 1, y: -1 }, // DLF
		{ x: -1, z: -1, y: -1 }, // DBL
		{ x: 1, z: -1, y: -1 }, // DRB
		{ x: 1, z: 1, y: -1 } // DFR
	];
	const cornerCenters = [
		// U D F B L R
		[0, 1, 4], // UFL
		[0, 4, 1], // ULB
		[0, 1, 5], // UBR
		[0, 5, 2], // URF
		[1, 4, 2], // DLF
		[1, 3, 4], // DBL
		[1, 5, 3], // DRB
		[1, 2, 5] // DFR
	];
	const edgeAddresses = [
		{ x: 0, z: 1, y: 1 }, //[U, F],
		{ x: -1, z: 0, y: 1 }, //[U, L],
		{ x: 0, z: -1, y: 1 }, //[U, B],
		{ x: 1, z: 0, y: 1 }, //[U, R],
		{ x: 0, z: 1, y: -1 }, //[D, F],
		{ x: -1, z: 0, y: -1 }, //[D, L],
		{ x: 0, z: -1, y: -1 }, //[D, B],
		{ x: 1, z: 0, y: -1 }, //[D, R],
		{ x: -1, z: 1, y: 0 }, //[F, L],
		{ x: -1, z: -1, y: 0 }, //[B, L],
		{ x: 1, z: -1, y: 0 }, //[B, R],
		{ x: 1, z: 1, y: 0 } //[F, R]
	];
	const edgeCenters = [
		[0, 2], //[U, F],
		[0, 4], //[U, L],
		[0, 3], //[U, B],
		[0, 5], //[U, R],
		[1, 2], //[D, F],
		[1, 4], //[D, L],
		[1, 3], //[D, B],
		[1, 5], //[D, R],
		[2, 4], //[F, L],
		[3, 4], //[B, L],
		[3, 5], //[B, R],
		[2, 5] //[F, R]
	];
	const centerAddresses = [
		{ x: 0, y: 1, z: 0 }, // U
		{ x: 0, y: -1, z: 0 }, // D
		{ x: 0, y: 0, z: 1 }, // F
		{ x: 0, y: 0, z: -1 }, // B
		{ x: -1, y: 0, z: 0 }, // L
		{ x: 1, y: 0, z: 0 } // R
	];
	const centerCenters = [0, 1, 2, 3, 4, 5];
	const tick = () => {
		count++;
		handle = window.requestAnimationFrame(tick);
	};
	let handle;
	tick();
	function twist() {
		tOff = { ...tweened(0, { duration: 1000, easing: cubicOut }), face: 'L' };
		const unsub = tOff.subscribe(spinListener(tOff));
		tOff.unsub = unsub;
		$tOff = 1;
	}
	let lastPlayHead = -1;
	let lastAlg = '';
	$: if (playHead !== lastPlayHead || alg !== lastAlg) {
		const direction = playHead - lastPlayHead;
		while (lastPlayHead !== playHead) {
			console.log({ lastPlayHead, direction, playHead });
			twist();
			lastPlayHead += direction > 0 ? 1 : -1;
		}
	}
	let cubeState: CubieCube = new CubieCube();
	$: moves = new MoveSeq(alg);
	function spinListener(anim: AnimationStore) {
		const direction = playHead - lastPlayHead;
		let move = Move.all['id'];
		if (direction > 0 && playHead > 0) {
			move = moves.moves[lastPlayHead];
		} else if (direction < 0 && playHead < moves.length()) {
			move = moves.moves[lastPlayHead - 1].inv();
		}
		const centerIndex = ['U', 'D', 'F', 'B', 'L', 'R'].indexOf(move.name[0]);
		const axis = ['y', 'y', 'z', 'z', 'x', 'x'];
		const centers = cubeState.tp.slice(0);
		const corners = cubeState.cp.slice(0);
		const cornerOri = cubeState.co.slice(0);
		const edges = cubeState.ep.slice(0);
		const edgeOri = cubeState.eo.slice(0);
		cubeState = cubeState.apply(move);
		const filter = (_: any, i: number) => i === centers[centerIndex];
		const cornerFilter = (a: any, i: number) =>
			move.cpc.map((x) => corners[x[0]]).indexOf(i) !== -1;
		const edgeFilter = (a: any, i: number) => move.epc.map((x) => edges[x[0]]).indexOf(i) !== -1;
		console.log('Move name: ', move.name, move);
		const addresses = [
			...cornerAddresses.filter(cornerFilter),
			...edgeAddresses.filter(edgeFilter),
			...centerAddresses.filter(filter)
		];
		const centerIndexes = [
			...cornerCenters.map((x, i) => x[cornerOri[corners[i]]]).filter(cornerFilter),
			...edgeCenters.map((x, i) => x[edgeOri[edges[i]]]).filter(edgeFilter),
			...centerCenters.filter(filter)
		];
		return (rot: number) => {
			if (rot === 0) {
				console.log('Animation started for face ', anim.face);
			}
			if (rot === 1) {
				if (anim.unsub) {
					console.log('Animation ended for face ', anim.face);
					anim.unsub();
				}
			}
			let d = 1;
			if (move.name.length > 1) {
				let offset = 1;
				if (move.name[1] > '0' && move.name[1] < '9') {
					d = parseInt(move.name[1]);
					offset++;
				}
				if (move.name.length > offset) {
					d *= -1;
				}
			}
			addresses.forEach((a, j) => {
				const i = address(a);
				const ci = centerIndex;
				const rotMove = new Quaternion();
				const fullMove = new Quaternion();
				let vec = new Vector3(0, 0, 1);
				if (axis[ci] === 'x') {
					vec = new Vector3(1, 0, 0);
				} else if (axis[ci] === 'y') {
					vec = new Vector3(0, 1, 0);
				}
				rotMove.setFromAxisAngle(vec, (rot * (-d * Math.PI)) / 2);
				fullMove.setFromAxisAngle(vec, (-d * Math.PI) / 2);
				if (cubiesInfo[i].mesh) {
					if (rot === 0) {
						if (!cubiesInfo[i].destination) {
							cubiesInfo[i].destination = cubiesInfo[i].mesh!.quaternion.clone();
						}
						cubiesInfo[i].source = cubiesInfo[i].destination!.clone();
						cubiesInfo[i].destination = fullMove.multiply(cubiesInfo[i].destination!);
					}
					const now = rotMove.multiply(cubiesInfo[i].source!);
					cubiesInfo[i].mesh!.quaternion.set(now.x, now.y, now.z, now.w);
				}

				if (rot === 0) {
					const q = fullMove;
					let s = 1;
					if (1 - q.w * q.w > 0.000001) {
						s = Math.sqrt(1 - q.w * q.w);
					}
					const axis = vec; //new Vector3(q.x / s, q.y / s, q.z / s).normalize();
					if (cubiesInfo[i].source) axis.applyQuaternion(cubiesInfo[i].source!);
					let size = cubiesInfo[i].size;
					if (Math.abs(axis.x) > 0.5) {
						size.x = 0.85;
						console.log('S X');
					} else if (Math.abs(axis.y) > 0.5) {
						size.y = 0.85;
						console.log('S Y', cubiesInfo[i].mesh?.up);
					} else {
						size.z = 0.85;
						console.log('S Z');
					}
					cubiesInfo[i].mesh!.geometry = createBoxGeometry(
						cubiesInfo[i].position,
						cubiesInfo[i].size
					);
				}
			});
		};
	}

	$: if (playHead < 0) {
		playHead = 0;
	}
	$: if (playHead > moves.length()) {
		playHead = moves.length();
	}
	function onPointerEnter(c: CubieInfo) {
		return () => {
			//console.log({ mp: c.mesh })
			//c.mesh!.material = getMaterial({x: 0, y: 0, z: 0})
			//c.mesh!.geometry = createBoxGeometry(c.position, { x: 0.5, y: 0.5, z: 0.5 })
		};
	}
	function onPointerLeave(c: CubieInfo) {
		return () => {
			//c.mesh!.material = getMaterial(c.position)
		};
	}
</script>

<div>
	{#each alg.split(' ') as turn, i}
		<span class:selected={i === playHead} id="t{i}">{turn}</span>
	{/each} @ {playHead}
</div>
<Canvas flat={true}>
	<PerspectiveCamera position={{ x: 10, y: 10, z: 10 }} fov={24}>
		<OrbitControls autoRotate={false} enableZoom={false} target={{ y: 0.5 }} />
	</PerspectiveCamera>

	<DirectionalLight color={'white'} position={{ x: -15, y: 45, z: 20 }} intensity={0.8} />
	<DirectionalLight color={'white'} position={{ x: 15, y: 45, z: -20 }} intensity={0.8} />
	<HemisphereLight skyColor={colors.white} groundColor={colors.grey} intensity={0.4} />
	<AmbientLight color={'white'} intensity={0.4} />

	<FrameLoop />

	<!-- Cube -->
	{#each cubiesInfo as cubie}
		<Mesh
			interactive
			on:pointerenter={onPointerEnter(cubie)}
			on:pointerleave={onPointerLeave(cubie)}
			bind:mesh={cubie.mesh}
			geometry={createBoxGeometry(cubie.position)}
			material={getMaterial(cubie.position)}
		/>
	{/each}
</Canvas>

<style>
	span {
		font-family: Roboto, sans-serif;
		font-size: 32px;
		padding: 8px;
	}
	div {
		margin-bottom: -32px;
		padding: 0px;
	}
	.selected {
		font-weight: bold;
	}
</style>
