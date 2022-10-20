import { expect } from 'chai';
import { describe, it } from 'vitest';

import { delete_stage, initialState, new_stage, set_state, stages } from '$lib/components/stages';
import type { MaskT } from '$lib/third_party/onionhoney/CubeLib';

describe('stages', () => {
	it('can create a new stage', () => {
		const mask: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		let nextState = stages(initialState, new_stage({ id: 'abcd', name: 'cross', mask }));
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'])).to.equal(
			JSON.stringify({ mask, name: 'cross' })
		);
	});
	it('can create and delete new stage', () => {
		const mask: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		let nextState = stages(initialState, new_stage({ id: 'cross', name: 'cross', mask }));
		expect(JSON.stringify(nextState.stageIdToStageMap['cross'])).to.equal(
			JSON.stringify({ mask, name: 'cross' })
		);
		nextState = stages(nextState, delete_stage('cross'));
		expect(Object.keys(nextState.stageIdToStageMap).length).to.equal(0);
	});
	it('can create and edit new stage', () => {
		const mask: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		const expected: MaskT = {
			cp: [0, 1, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		let nextState = stages(initialState, new_stage({ id: 'cross', name: 'cross', mask }));
		expect(JSON.stringify(nextState.stageIdToStageMap['cross'])).to.equal(
			JSON.stringify({ mask, name: 'cross' })
		);
		nextState = stages(
			nextState,
			set_state({ id: 'cross', orbit: 'CORNERS', index: 1, positioned: true })
		);
		nextState = stages(
			nextState,
			set_state({ id: 'cross', orbit: 'EDGES', index: 2, positioned: true })
		);
		expect(JSON.stringify(nextState.stageIdToStageMap['cross'])).to.equal(
			JSON.stringify({ mask: expected, name: 'cross' })
		);
	});

	it('can create and set orientation on a new stage', () => {
		const mask: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		const expected: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
			co: [0, 1, 0, 0, 0, 0, 0, 0],
			eo: [0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1]
		};
		let nextState = stages(initialState, new_stage({ id: 'abcd', name: 'cross', mask }));
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'])).to.equal(
			JSON.stringify({ mask, name: 'cross' })
		);
		nextState = stages(
			nextState,
			set_state({ id: 'abcd', orbit: 'CORNERS', index: 1, oriented: true })
		);
		nextState = stages(
			nextState,
			set_state({ id: 'abcd', orbit: 'EDGES', index: 2, oriented: true })
		);
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'].mask.cp)).to.equal(
			JSON.stringify(expected.cp)
		);
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'].mask.ep)).to.equal(
			JSON.stringify(expected.ep)
		);
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'].mask.eo)).to.equal(
			JSON.stringify(expected.eo)
		);
		expect(JSON.stringify(nextState.stageIdToStageMap['abcd'].mask.co)).to.equal(
			JSON.stringify(expected.co)
		);
	});
});
