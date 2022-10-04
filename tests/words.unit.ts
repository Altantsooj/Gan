import { expect } from 'chai';

import {
	words,
	play,
	initialWordsState,
	type WordsState,
	type WordsMove
} from '$lib/components/words';
import { describe, it } from 'vitest';

describe('words', () => {
	it('initial state', () => {
		expect(initialWordsState.board.length).to.equals(15);
		expect(initialWordsState.board[0].length).to.equals(15);
	});

	it('play horizontal move', () => {
		const move: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello'
		};
		const nextState = words(
			{
				...initialWordsState
			},
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('hello');
	});

	function transpose(array: any[][]) {
		return array.map((_, colIndex) => array.map((row) => row[colIndex]));
	}

	it('play vertical move', () => {
		const move: WordsMove = {
			x: 7,
			y: 7,
			isVertical: true,
			letters: 'hello'
		};
		const nextState = words(
			{
				...initialWordsState
			},
			play(move)
		);
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[7].join('')).to.be.equal('hello');
	});

	it('play vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello'
		};
		const firstState = words(
			{
				...initialWordsState
			},
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 11,
			y: 6,
			isVertical: true,
			letters: 'godbye'
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('hello');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[11].join('')).to.be.equal('goodbye');
	});

	it('play out of bound horizontal move', () => {
		const move: WordsMove = {
			x: 14,
			y: 7,
			isVertical: false,
			letters: 'hello'
		};
		const nextState = words(
			{
				...initialWordsState
			},
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('');
	});

	it('play wrong initial horizontal move', () => {
		const move: WordsMove = {
			x: 0,
			y: 7,
			isVertical: false,
			letters: 'hello'
		};
		const nextState = words(
			{
				...initialWordsState
			},
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('');
	});

	it('play wrong vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello'
		};
		const firstState = words(
			{
				...initialWordsState
			},
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 0,
			y: 6,
			isVertical: true,
			letters: 'godbye'
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('hello');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[0].join('')).to.be.equal('');
	});

	it('play legal vertical move with existing adjacent tiles', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'him'
		};
		const firstState = words(
			{
				...initialWordsState
			},
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 6,
			y: 6,
			isVertical: false,
			letters: 'foo'
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('him');
		expect(nextState.board[6].join('')).to.be.equal('foo');
	});
});
