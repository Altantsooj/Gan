import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface WordsState {
	board: string[][];
	width: number;
	height: number;
}

export interface WordsMove {
	x: number;
	y: number;
	isVertical: boolean;
	letters: string;
}

export const play = createAction<WordsMove>('play');

export const initialWordsState = {
	board: new Array(15).fill('').map((x) => new Array(15)),
	width: 15,
	height: 15
} as WordsState;

export const words = createReducer(initialWordsState, (r) => {
	function hasAdjacentTile(board: string[][], x: number, y: number) {
		return (
			isOccupied(board, x, y + 1) ||
			isOccupied(board, x, y - 1) ||
			isOccupied(board, x + 1, y) ||
			isOccupied(board, x - 1, y)
		);
	}

	// Will return false if out of bound.
	function isOccupied(board: string[][], x: number, y: number) {
		if (x < 0 || x > board[0].length || y < 0 || y > board.length) {
			return false;
		}
		return board[y][x] != undefined;
	}

	r.addCase(play, (state, { payload }) => {
		// If horizontal play
		let { x, y, letters, isVertical } = payload;
		let newBoard = state.board.map((x) => [...x]);
		let legalPlay = false;
		for (const l of letters) {
			while (newBoard[y][x]) {
				isVertical ? y++ : x++;
				if (x >= state.width || y >= state.height) {
					console.error('Out of bounds play', payload);
					return state;
				}
			}
			if (x === 7 && y === 7) legalPlay = true;
			newBoard[y][x] = l;
			legalPlay = legalPlay || hasAdjacentTile(state.board, x, y);
		}
		if (!legalPlay) return state;
		return { ...state, board: newBoard };
	});
});
