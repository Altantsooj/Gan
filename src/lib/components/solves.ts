import { CubeUtil, CubieCube, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export type MoveInfo = { move: string; timestamp: number };
export interface SolvePayload {
	solveId: string;
	scramble: string;
	moves: MoveInfo[];
	time: number;
}
export interface SolveSplit {
	numMovesToScramble: number;
	numMovesToSolve: number;
}
export type Solve = SolvePayload & SolveSplit;
export interface SolvesState {
	allScrambles: string[];
	allSolveIds: string[];
	unattempted: string[];
	scrambleToId: { [scramble: string]: string };
	scrambleToSolveIds: { [scramble: string]: string[] };
	solveIdToSolve: { [id: string]: Solve };
}

export const add_scramble = createAction<{ scramble: string; id: string }>('add_scramble');
export const add_solve = createAction<SolvePayload>('add_solve');

export const initialState = {
	allScrambles: [],
	allSolveIds: [],
	unattempted: [],
	scrambleToId: {},
	scrambleToSolveIds: {},
	solveIdToSolve: {}
} as SolvesState;

export function makeSolve(solve: SolvePayload): Solve {
	let cube = new CubieCube().apply(new MoveSeq(solve.scramble).inv());
	let numMovesToScramble = 0;
	while (!CubeUtil.is_cube_solved(cube) && numMovesToScramble < solve.moves.length) {
		const qMoves: MoveSeq = new MoveSeq(solve.moves[numMovesToScramble++].move).toQuarter();
		for (let i = 0; i < qMoves.length(); ++i) {
			cube = cube.apply(qMoves.moves[i]);
			if (CubeUtil.is_cube_solved(cube) && i + 1 < qMoves.moves.length) {
				// split is in the middle of this move.
				const turns = solve.moves;
				const scrambleSeq = qMoves.moves.slice(0, i + 1).map((x) => {
					return { move: x.name, timestamp: 0 };
				});
				const timestamp = solve.moves[numMovesToScramble - 1].timestamp;
				const solveSeq = {
					move: new MoveSeq(qMoves.moves.slice(i + 1)).collapse().moves[0].name,
					timestamp
				};
				const scrambleTurns = [...turns.slice(0, numMovesToScramble - 1), ...scrambleSeq];
				const solveTurns = [solveSeq, ...turns.slice(numMovesToScramble)];
				solve.moves = [...scrambleTurns, ...solveTurns] as MoveInfo[];
				break;
			}
		}
	}
	return {
		...solve,
		numMovesToScramble,
		numMovesToSolve: solve.moves.length - numMovesToScramble
	};
}

export const solves = createReducer(initialState, (r) => {
	r.addCase(add_scramble, (state, action) => {
		state.allScrambles.push(action.payload.scramble);
		if (!state.scrambleToSolveIds[action.payload.scramble]) {
			state.unattempted.push(action.payload.scramble);
		}
		state.scrambleToId[action.payload.scramble] = action.payload.id;
		return state;
	}).addCase(add_solve, (state, action) => {
		state.unattempted = state.unattempted.filter((x) => x !== action.payload.scramble);
		state.allSolveIds.push(action.payload.solveId);
		if (!state.scrambleToSolveIds[action.payload.scramble]) {
			state.scrambleToSolveIds[action.payload.scramble] = [];
		}
		state.scrambleToSolveIds[action.payload.scramble].push(action.payload.solveId);
		state.solveIdToSolve[action.payload.solveId] = makeSolve(action.payload);
		return state;
	});
});
