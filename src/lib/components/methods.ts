import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export type StageMap = { [k: string]: string[] };
export interface MethodsState {
	methodToStageMap: { [k: string]: StageMap };
	methodToNameMap: { [k: string]: string };
	stateFromToMovesMap: { [k: string]: string };
	stateFromToNameMap: { [k: string]: string };
}

export const new_method = createAction<{ name: string; id: string }>('new_method');
export const delete_method = createAction<string>('delete_method');
export const add_stage = createAction<{ method: string; parent?: string; stage: string }>(
	'add_stage'
);
export const rename_stage = createAction<{ method: string; stage: string; name: string }>(
	'rename_stage'
);
export const remove_stage = createAction<{ method: string; stage: string }>('remove_stage');
export const set_moveset = createAction<{
	method: string;
	from_id: string;
	to_id: string;
	moveset: string;
}>('set_moveset');
export const set_algsetname = createAction<{
	method: string;
	from_id: string;
	to_id: string;
	name: string;
}>('set_algsetname');

export function makeFromToKey(payload: { from_id: string; to_id: string }): string {
	return payload.from_id + '||' + payload.to_id;
}

export const initialState: MethodsState = {
	methodToStageMap: {},
	methodToNameMap: {},
	stateFromToMovesMap: {},
	stateFromToNameMap: {}
};

export const methods = createReducer(initialState, (r) => {
	r.addCase(new_method, (state, { payload }) => {
		state.methodToStageMap[payload.id] = {};
		state.methodToNameMap[payload.id] = payload.name;
	});

	r.addCase(add_stage, (state, { payload }) => {
		const parent = payload.parent || 'scrambled';
		if (!state.methodToStageMap[payload.method][parent]) {
			state.methodToStageMap[payload.method][parent] = [];
		}
		state.methodToStageMap[payload.method][parent].push(payload.stage);
	});

	r.addCase(set_moveset, (state, { payload }) => {
		state.stateFromToMovesMap[makeFromToKey(payload)] = payload.moveset;
	});
	r.addCase(set_algsetname, (state, { payload }) => {
		state.stateFromToNameMap[makeFromToKey(payload)] = payload.name;
	});

	r.addCase(remove_stage, (state, { payload }) => {
		function removeNode(state: MethodsState, method: string, node: string) {
			let links = state.methodToStageMap[method][node] || [];
			delete state.methodToStageMap[method][node];
			Object.keys(state.methodToStageMap[method]).forEach((n) => {
				const newChildren: string[] = state.methodToStageMap[method][n].filter(
					(x: string) => x !== node
				);
				state.methodToStageMap[method][n] = newChildren;
				newChildren.forEach((child) => (links = links.filter((x) => x !== child)));
			});
			links.forEach((link) => removeNode(state, method, link));
		}
		removeNode(state, payload.method, payload.stage);
	});
	r.addCase(rename_stage, (state, { payload }) => {
		function renameNode(state: MethodsState, method: string, node: string, name: string) {
			let links = state.methodToStageMap[method][node] || [];
			delete state.methodToStageMap[method][node];
			state.methodToStageMap[method][name] = links;
		}
		renameNode(state, payload.method, payload.stage, payload.name);
		Object.keys(state.methodToStageMap[payload.method]).forEach((stage) => {
			let links = state.methodToStageMap[payload.method][stage] || [];
			links = links.map((link) => (link === payload.stage ? payload.name : link));
			state.methodToStageMap[payload.method][stage] = links;
		});
	});
	r.addCase(delete_method, (state, { payload }) => {
		delete state.methodToStageMap[payload];
		delete state.methodToNameMap[payload];
	});
});
