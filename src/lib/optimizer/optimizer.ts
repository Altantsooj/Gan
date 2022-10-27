import {
	get_oris,
	is_fb_solved,
	solve,
	type SolutionDesc,
	type SolverConfig
} from '$lib/third_party/onionhoney/Analyzer';
import { CubeUtil, CubieCube, FaceletCube, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { store } from '$lib/store';

export function getUpFaceRotation(cube: CubieCube): string {
	const rotations = ['', 'z2', 'x', "x'", 'z', "z'"];
	const index = cube.tp.indexOf(0);
	return rotations[index];
}

export function getUpFrontFaceRotation(cube: CubieCube): string {
	const upRot = getUpFaceRotation(cube);
	cube = cube.apply(upRot);
	const rotations = ['', '', '', 'y2', "y'", 'y'];
	const index = cube.tp.indexOf(2);
	return upRot + ' ' + rotations[index];
}

export interface OptimizedStage {
	orientation?: string;
	stage: string;
	solution: MoveSeq;
	score: number;
}

export function movesToString(seq: MoveSeq): string {
	return seq.moves.map((x) => x.name).join(' ');
}

export function visualize(cube: CubieCube): string {
	const faceletCube = FaceletCube.from_cubie(cube);
	return FaceletCube.to_unfolded_cube_str(faceletCube);
}

export function makeOptimizedData(
	scrambleString: string,
	rstages: SolutionDesc[]
): OptimizedStage[][] {
	if (rstages[0].stageId) {
		console.log('*************************');
		console.log('*************************');
		console.log('***    NEW SOLVER    ***');
		console.log('*************************');
		console.log('*************************');
		return makeOptimizedDataFromStages(scrambleString, rstages);
	}
	return makeOptimizedRouxData(scrambleString, rstages);
}
export function makeOptimizedDataFromStages(scrambleString: string, rstages: SolutionDesc[]) {
	const optimized: OptimizedStage[][] = [];

	let cube = new CubieCube().apply(scrambleString);
	for (let i = 0; i < rstages.length; ++i) {
		const stage = rstages[i];
		const config: SolverConfig = {
			premoves: [stage.view ? stage.view.toString() : ''],
			num_solution: 2,
			upper_limit: Math.min(11, stage.solution.length())
		};
		const ori = stage.orientation || '';
		const spin = new MoveSeq(ori);
		cube = cube.changeBasis(spin);
		const startTimestamp = new Date().getTime();
		optimized.push(
			solve(stage.stageId || stage.stage, cube, config, i > 0 ? rstages[i - 1].stageId : undefined)
				.map((sol) => ({
					...sol,
					orientation: ori,
					stage: stage.stage
				}))
				.sort((x, y) => x.score - y.score)
		);
		const solveDoneTimestamp = new Date().getTime();
		console.log({ solveTime: solveDoneTimestamp - startTimestamp });
		const thisPhase = optimized.slice(-1)[0];
		if (thisPhase.length) {
			console.log(`New solver found ${thisPhase.length} options`);
			console.log(stage.stage, ': ', stage.stageId);
			console.log(thisPhase);
			const optcube = cube.apply(thisPhase[0].solution);
			const v = visualize(optcube);
			console.log(v);
			if (stage.stageId) {
				const mask = store.getState().stages.stageIdToStageMap[stage.stageId].mask;
				console.log('Solved? ', CubeUtil.is_solved(optcube, mask));
			}
		}
		if (stage.view) {
			cube = cube.apply(stage.view!.inv());
		}
		cube = cube.apply(stage.rotatedSolution);
	}

	return optimized;
}
export function makeOptimizedRouxData(
	scrambleString: string,
	rstages: SolutionDesc[]
): OptimizedStage[][] {
	const optimized = [];
	if (rstages && rstages[0] && rstages[0].stage === 'fb') {
		console.log({
			stage: rstages[0].stage,
			orientation: rstages[0].orientation,
			solution: rstages[0].solution.moves.map((x) => x.name).join(' ')
		});

		let cube = new CubieCube().apply(scrambleString);
		console.log(scrambleString);
		let faceletCube = FaceletCube.from_cubie(cube);
		let visual = FaceletCube.to_unfolded_cube_str(faceletCube);
		console.log(visual);
		const ori = rstages[0].orientation || '';
		const config: SolverConfig = {
			premoves: ['', 'x', 'x2', "x'"],
			num_solution: 2,
			upper_limit: 9
		};
		const spin = new MoveSeq(ori);
		optimized.push(
			solve(
				'fb',
				cube.changeBasis(spin), //.changeBasis(spin).apply(spin.inv())/*.apply(spin).changeBasis(spin).apply(spin)*/
				config
			)
				.map((sol) => ({
					...sol,
					orientation: ori,
					stage: 'fb'
				}))
				.sort((x, y) => x.score - y.score)
		);
		const quicker = optimized[0][0].solution.moves.map((x) => x.name).join(' ');
		console.log({ optimized, quicker });
		//cube = cube.apply(new MoveSeq(ori));
		cube = cube.apply(optimized[0][0].solution.moves);
		faceletCube = FaceletCube.from_cubie(cube);
		visual = FaceletCube.to_unfolded_cube_str(faceletCube);
		console.log(visual);
	}
	for (let i = 1; rstages && i < rstages.length; ++i) {
		if (i == 3) {
			optimized.push([
				{
					stage: 'cmll',
					solution: new MoveSeq([]),
					score: 0
				}
			]);
			continue; // CMLL
		}
		const ori = rstages[0].orientation || '';
		const spin = new MoveSeq(ori);
		let cube = new CubieCube().apply(scrambleString);
		let setup = scrambleString;
		console.log(scrambleString);
		for (let pre = 0; pre < i; ++pre) {
			console.log({ pre, s: rstages[pre].solution.toString() });
			if (pre === 0 && rstages[pre].orientation) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const spin = new MoveSeq(rstages[pre].orientation!);
				cube = cube.apply(spin);
				cube = cube.changeBasis(spin);
				cube = cube.apply(spin.inv());
				console.log(visualize(cube));
			}
			if (rstages[pre].view) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				cube = cube.apply(rstages[pre].view!.inv());
				setup += '/' + rstages[pre].view?.inv();
			}
			cube = cube.apply(rstages[pre].rotatedSolution);
			setup += '-/-' + rstages[pre].rotatedSolution;
			if (pre === 0) {
				const v = visualize(cube);
				console.log(v);
				const oldOri = ori;
				const oris = get_oris('cn').map((m) => new MoveSeq(m));
				const newOri = is_fb_solved(cube, oris);
				if (newOri) {
					console.log({ oldOri, newOri: newOri.toString() });
				} else {
					console.log('ERROR: Failed to solve');
				}
			}
		}
		setup += ' [spin: ' + spin + '] ';
		//cube = cube.changeBasis(spin).apply(spin.inv());
		if (i === 1) {
			const v = visualize(cube);
			console.log(scrambleString);
			console.log(movesToString(rstages[0].solution));
			console.log(v);
		}
		const config: SolverConfig = {
			num_solution: 2,
			upper_limit: 15
		};
		const stageNames = i == 1 ? ['ss-front', 'ss-back'] : i == 2 ? ['sb'] : ['lse'];
		optimized.push(
			stageNames
				.map((n) =>
					solve(n, cube, config).map((sol) => ({
						...sol,
						setup,
						stage: n
					}))
				)
				.flat()
				.sort((x, y) => x.score - y.score)
		);
	}
	return optimized;
}
