import { expect } from 'chai';
import { describe, it } from 'vitest';

import { initialState, add_scramble, add_solve, solves } from '$lib/components/solves';

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
});
