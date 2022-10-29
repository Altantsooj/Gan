import { visualize } from '$lib/optimizer/optimizer';
import { store } from '$lib/store';
import {
	get_oris,
	is_fb_solved,
	prerotate_solves,
	type SolutionDesc
} from '$lib/third_party/onionhoney/Analyzer';
import { CubeUtil, CubieCube, Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import type { MethodsState } from './methods';
import type { StagesState } from './stages';

export function analyzeSolve(method: string, scrambleString: string, solutionString: string) {
	const state = store.getState();
	const methods = state.methods;
	const stages = state.stages;
	return analyzeSolve2(method, scrambleString, solutionString, methods, stages);
}

export function analyzeSolve2(
	method: string,
	scrambleString: string,
	solutionString: string,
	methods: MethodsState,
	stages: StagesState
) {
	const scramble = new MoveSeq(scrambleString);
	const solution = new MoveSeq(solutionString);
	const scrambledCube = new CubieCube().apply(scramble);
	const allOris = get_oris('cn').map((o) => new MoveSeq(o));
	const solvedCubes = allOris.map((o) => scrambledCube.apply(solution).apply(o));
	const solved = solvedCubes.filter((x) => CubeUtil.is_cube_solved(x));
	if (solved.length !== 1) {
		const e = `Cube\n${visualize(solvedCubes[0])}\ndoes not look solved`;
		throw e;
	}
	const ret = [];
	const state = { methods, stages };

	if (!state.methods.methodToStageMap[method]) {
		const e = `method ${method} not found in custom methods`;
		throw e;
	}
	const moves = [Move.all['id'], ...solution.moves]; //.map(x => new MoveSeq([x]).toQuarter().moves).flat();
	let currentStage = 'scrambled';
	let cube = scrambledCube;
	let movesSoFar = [];
	let chosenStage = '';
	let ori: MoveSeq = new MoveSeq('');
	let prerotate: MoveSeq | undefined = undefined;
	const accumulated_rots: MoveSeq[] = [];
	let frozenFace: string | undefined = undefined;
	for (const move of moves) {
		const stageSuccessors = state.methods.methodToStageMap[method][currentStage];
		cube = cube.apply(move);
		if (move.name !== 'id') movesSoFar.push(move);
		let found = false;
		for (const stageOption of stageSuccessors) {
			const firstMask = state.stages.stageIdToStageMap[stageOption].mask;
			const possibleOris = state.stages.stageIdToStageMap[stageOption].orientations;
			const oris = possibleOris.map((m) => new MoveSeq(m));
			for (const o of oris) {
				const checkOrientation = cube.changeBasis(o);
				const freeFace = state.stages.stageIdToStageMap[stageOption].free_face;
				prerotate = prerotate_solves(checkOrientation, firstMask, allOris, freeFace);
				if (prerotate !== undefined) {
					found = true;
					ori = o;
					chosenStage = stageOption;
					break;
				}
			}
			if (found) break;
		}
		if (found) {
			let rotatedSolution = new MoveSeq(movesSoFar);
			let rot = new MoveSeq([]);
			ret.forEach((priorStage) => {
				if (priorStage.orientation) {
					rot = new MoveSeq(priorStage.orientation);
				}
				if (priorStage.view) {
					rot = new MoveSeq([rot.moves, priorStage.view.inv().moves].flat());
				}
			});
			rotatedSolution = rotatedSolution.pushBackAll(rot).tail(rot.length());
			rotatedSolution = rotatedSolution.pushBackAll(ori).tail(ori.length());
			cube = cube.changeBasis(ori).apply(ori.inv());
			if (prerotate && ori.length() > 0) {
				rotatedSolution = rotatedSolution.pushBackAll(prerotate).tail(prerotate.length());
			}
			if (frozenFace !== undefined) {
				rotatedSolution = preferRwide(rotateMoves(rotatedSolution.moves));
			}
			if (state.stages.stageIdToStageMap[chosenStage].frozen_face) {
				frozenFace = state.stages.stageIdToStageMap[chosenStage].frozen_face;
				if (frozenFace !== 'L') {
					throw 'Freezing non-L faces not yet supported';
				}
			}
			const solutionFound: SolutionDesc = {
				solution: new MoveSeq(movesSoFar),
				rotatedSolution,
				orientation: ori.length() > 0 ? ori.toString() : undefined,
				view: ori.length() > 0 ? prerotate?.inv() : undefined,
				score: 0,
				stage: state.stages.stageIdToStageMap[chosenStage].name,
				stageId: chosenStage
			};
			ret.push(solutionFound);
			currentStage = chosenStage;
			movesSoFar = [];
		}
	}
	return ret;

	function rotateMoves(seq: Move[]) {
		let rotated = new MoveSeq(seq);
		for (let i = 0; i < accumulated_rots.length; ++i) {
			rotated = rotated.pushBackAll(accumulated_rots[i]).tail(accumulated_rots[i].length());
		}
		return rotated;
	}

	function preferRwide(moves: MoveSeq): MoveSeq {
		for (let i = 0; i < moves.length(); ++i) {
			if (moves.moves[i].name.slice(0, 1) === 'L') {
				const rotation = 'x' + moves.moves[i].name.slice(1);
				const rSeq = new MoveSeq(rotation);
				const wide = 'r' + moves.moves[i].name.slice(1);
				const wSeq = new MoveSeq(wide);
				const prefix = moves.moves.slice(0, i);
				const suffix = preferRwide(
					new MoveSeq(moves.moves.slice(i + 1)).pushBackAll(rSeq).tail(rSeq.length())
				);
				accumulated_rots.push(rSeq);
				return new MoveSeq([prefix, wSeq.moves, suffix.moves].flat());
			}
			if (moves.moves[i].name.slice(0, 1) === 'l') {
				const rotation = 'x' + moves.moves[i].name.slice(1);
				const rSeq = new MoveSeq(rotation);
				const unWide = 'R' + moves.moves[i].name.slice(1);
				const wSeq = new MoveSeq(unWide);
				const prefix = moves.moves.slice(0, i);
				const suffix = preferRwide(
					new MoveSeq(moves.moves.slice(i + 1)).pushBackAll(rSeq).tail(rSeq.length())
				);
				accumulated_rots.push(rSeq);
				return new MoveSeq([prefix, wSeq.moves, suffix.moves].flat());
			}
		}
		return moves;
	}
}
