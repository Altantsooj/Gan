import { visualize } from '$lib/optimizer/optimizer';
import { store } from '$lib/store';
import {
	get_oris,
	is_fb_solved,
	prerotate_solves,
	type SolutionDesc
} from '$lib/third_party/onionhoney/Analyzer';
import { CubeUtil, CubieCube, Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';

export function analyzeSolve(method: string, scrambleString: string, solutionString: string) {
	const scramble = new MoveSeq(scrambleString);
	const solution = new MoveSeq(solutionString);
	const scrambledCube = new CubieCube().apply(scramble);
	const allOris = get_oris('cn').map((o) => new MoveSeq(o));
	const solvedCubes = allOris.map((o) => scrambledCube.apply(solution).apply(o));
	const solved = solvedCubes.filter((x) => CubeUtil.is_cube_solved(x));
	if (solved.length !== 1) {
		throw `Cube\n${visualize(solvedCubes[0])}\ndoes not look solved`;
	}
	let ret = [];
	const state = store.getState();

	if (!state.methods.methodToStageMap[method]) {
		throw `method ${method} not found in custom methods`;
	}
	const moves = [Move.all['id'], ...solution.moves];
	let currentStage = 'scrambled';
	const optionIdToMatch: { [id: string]: boolean } = {};
	let cube = scrambledCube;
	let movesSoFar = [];
	let chosenStage = '';
	let ori: MoveSeq = new MoveSeq('');
	let prerotate: MoveSeq | undefined = undefined;
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
				prerotate = prerotate_solves(checkOrientation, firstMask, allOris);
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
					rot = new MoveSeq([rot.moves, priorStage.view.moves].flat());
				}
			});
			rotatedSolution = rotatedSolution.pushBackAll(rot).tail(rot.length());
			rotatedSolution = rotatedSolution.pushBackAll(ori).tail(ori.length());
			cube = cube.changeBasis(ori).apply(ori.inv());
			if (prerotate && ori.length() > 0) {
				rotatedSolution = rotatedSolution.pushBackAll(prerotate);
			}
			const solutionFound: SolutionDesc = {
				solution: new MoveSeq(movesSoFar),
				rotatedSolution,
				orientation: ori.length() > 1 ? ori.toString() : undefined,
				view: ori.length() > 1 ? prerotate : undefined,
				score: 0,
				stage: state.stages.stageIdToStageMap[chosenStage].name
			};
			ret.push(solutionFound);
			currentStage = chosenStage;
			movesSoFar = [];
		}
	}
	return ret;
}
