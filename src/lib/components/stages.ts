import { get_oris } from '$lib/third_party/onionhoney/Analyzer';
import { Mask, type MaskT } from '$lib/third_party/onionhoney/CubeLib';
import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export interface Stage {
	name: string;
	mask: MaskT;
	orientations: string[];
	frozen_face?: string;
	free_face?: string;
}
export interface StagesState {
	stageIdToStageMap: { [k: string]: Stage };
}

export const new_stage = createAction<{
	id: string;
	name: string;
	mask: MaskT;
	orientations?: string[];
	frozen_face?: string;
	free_face?: string;
}>('new_stage');
export const use_orientations = createAction<{ id: string; orientation_spec: string }>(
	'use_orientations'
);
export const set_free_face = createAction<{ id: string; free_face: string }>('set_free_face');
export const delete_stage = createAction<string>('delete_stage');
export const set_state = createAction<{
	id: string;
	orbit: string;
	index: number;
	oriented?: boolean;
	positioned?: boolean;
}>('set_state');

export const initialState: StagesState = {
	stageIdToStageMap: {}
};

export const stages = createReducer(initialState, (r) => {
	r.addCase(new_stage, (state, { payload }) => {
		let orientations = [''];
		if (payload.orientations) {
			orientations = payload.orientations;
		}
		state.stageIdToStageMap[payload.id] = {
			mask: Mask.copy(payload.mask),
			name: payload.name,
			orientations,
			frozen_face: payload.frozen_face,
			free_face: payload.free_face
		};
	});
	r.addCase(use_orientations, (state, { payload }) => {
		state.stageIdToStageMap[payload.id].orientations = get_oris(payload.orientation_spec);
	});
	r.addCase(set_free_face, (state, { payload }) => {
		state.stageIdToStageMap[payload.id].free_face = payload.free_face;
	});
	r.addCase(delete_stage, (state, { payload }) => {
		delete state.stageIdToStageMap[payload];
	});
	r.addCase(set_state, (state, { payload }) => {
		const mask = Mask.copy(state.stageIdToStageMap[payload.id].mask);
		let pa: number[] = mask.cp;
		let po: number[] | undefined = mask.co ? mask.co : undefined;
		if (payload.orbit === 'CENTERS') {
			pa = mask.tp ? mask.tp : new Array(6).fill(1);
			po = undefined;
		} else if (payload.orbit === 'EDGES') {
			pa = mask.ep;
			po = mask.eo ? mask.eo : undefined;
		}
		if (payload.oriented !== undefined) {
			if (!po) {
				po = pa.slice(0);
				if (payload.orbit === 'CORNERS') {
					mask.co = po;
				} else if (payload.orbit === 'EDGES') {
					mask.eo = po;
				}
			}
			po[payload.index] = payload.oriented ? 1 : 0;
		}
		if (payload.positioned !== undefined) {
			pa[payload.index] = payload.positioned ? 1 : 0;
		}
		state.stageIdToStageMap[payload.id] = { ...state.stageIdToStageMap[payload.id], mask };
	});
});
