import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	initialState,
	add_scramble,
	add_solve,
	solves,
	makeSolve,
	type SolvePayload,
	type MoveInfo
} from '$lib/components/solves';

describe('scrambles', () => {
	it('can add a scramble', () => {
		const scramble = "L R' L";
		const id = 'abcd-ef';
		const nextState = solves(initialState, add_scramble({ scramble, id }));
		expect(nextState.allScrambles.length).to.equal(1);
		expect(nextState.allScrambles[0]).to.equal(scramble);
		expect(nextState.unattempted.length).to.equal(1);
		expect(nextState.unattempted[0]).to.equal(scramble);
		expect(Object.keys(nextState.scrambleToSolveIds).length).to.equal(0);
	});

	it('can add a scramble after its time is recorded', () => {
		const scramble = "L R' L";
		const id = 'abcd-ef';
		const time = 5;
		let nextState = solves(initialState, add_solve({ scramble, moves: [], time, solveId: id }));
		nextState = solves(nextState, add_scramble({ scramble, id }));
		expect(nextState.allScrambles.length).to.equal(1);
		expect(nextState.allScrambles[0]).to.equal(scramble);
		expect(nextState.unattempted.length).to.equal(0);
		expect(Object.keys(nextState.scrambleToSolveIds).length).to.equal(1);
	});

	it('can filter scramble when a new time is recorded', () => {
		const scramble = "L R' L";
		const id = 'abcd-ef';
		const time = 5;
		let nextState = solves(initialState, add_scramble({ scramble, id }));
		const moves = [];
		moves.push({ move: 'L', timestamp: 0 });
		moves.push({ move: "R'", timestamp: 0 });
		moves.push({ move: 'L', timestamp: 0 });
		moves.push({ move: "L'", timestamp: 0 });
		moves.push({ move: 'R', timestamp: 0 });
		moves.push({ move: "L'", timestamp: 0 });
		nextState = solves(nextState, add_solve({ scramble, moves, time, solveId: id }));
		expect(nextState.allScrambles.length).to.equal(1);
		expect(nextState.allScrambles[0]).to.equal(scramble);
		expect(nextState.unattempted.length).to.equal(0);
		expect(Object.keys(nextState.scrambleToSolveIds).length).to.equal(1);
		const key = Object.keys(nextState.scrambleToSolveIds)[0];
		const solve = nextState.solveIdToSolve[nextState.scrambleToSolveIds[key][0]];
		expect(solve.moves.length).to.equal(6);
		expect(solve.numMovesToScramble).to.equal(3);
	});

	it('splits the scramble out of the turns correctly', () => {
		const bugData = {
			id: 'vuAoKoVVx0lMi7rqlZez',
			scramble: "D2 L U' D' R' F' L F2 R2 U R2 F2 U' R2 D F2 U' R2 B2 R U",
			turns:
				"D2' L U' D' R R2' F' L F2 R2 U R2 F2 U' R2 D' D2 F2 U' R2 B2' R U3 R' D B R' U R' d U B S' F' U F U' B' S' R2' B U B' S' R2 S R2 F' R F R2 F R F' R' F' U F U' R2 F R F' R' R F R' F' F R F' U' F R F' R' F' U F2 R' F' S R2 S R S' S R2 S' R2 S2' R3"
		};
		const moves: MoveInfo[] = bugData.turns.split(' ').map((x) => {
			return { move: x, timestamp: 0 };
		});
		const solvePayload: SolvePayload = {
			solveId: bugData.id,
			scramble: bugData.scramble,
			moves,
			time: 0
		};
		const scrambleLength = bugData.scramble.split(' ').length;
		const solve = makeSolve(solvePayload);
		// user made an R R2' move and a D' D2 move during the scramble
		expect(solve.numMovesToScramble).to.equal(scrambleLength + 2);
		// last move was a U3 which was really the U of the scramble and a U2
		// start to the solve
		expect(solve.moves.length).to.equal(moves.length + 1);
	});
});
