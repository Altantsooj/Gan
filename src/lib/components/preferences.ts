import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export interface PreferencesState {
	solutionMethodId: string;
}

export const set_solution_method = createAction<string>('set_solution_method');

export const initialState = {
	solutionMethodId: ''
};

export const preferences = createReducer(initialState, (r) => {
	r.addCase(set_solution_method, (state, { payload }) => {
		state.solutionMethodId = payload;
	});
});
