import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	add_stage,
	delete_method,
	initialState,
	methods,
	new_method,
	remove_stage,
	rename_stage
} from '$lib/components/methods';

describe('methods', () => {
	it('can create a new method', () => {
		const nextState = methods(initialState, new_method({ name: 'Fridrich', id: 'abc' }));
		expect(JSON.stringify(nextState.methodToStageMap['abc'])).to.equal('{}');
	});

	it('can create a stage map and wipe it out', () => {
		let nextState = methods(initialState, new_method({ name: 'Fridrich', id: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
		nextState = methods(nextState, add_stage({ method: 'Fridrich', stage: 'fb' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{"scrambled":["fb"]}');
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-back' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-front' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"]}'
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-back', stage: 'lp' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-front', stage: 'lp' })
		);
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'lp', stage: 'cmll' }));
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'cmll', stage: 'lse' }));
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'lse', stage: 'solved' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":["lp"],"ss-front":["lp"],"lp":["cmll"],"cmll":["lse"],"lse":["solved"]}'
		);
		nextState = methods(nextState, new_method({ id: 'Fridrich', name: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
	});

	it('expects removing a stage to remove its dependents', () => {
		let nextState = methods(initialState, new_method({ id: 'Fridrich', name: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
		nextState = methods(nextState, add_stage({ method: 'Fridrich', stage: 'fb' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{"scrambled":["fb"]}');
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-back' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-front' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"]}'
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-back', stage: 'lp' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-front', stage: 'lp' })
		);
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'lp', stage: 'cmll' }));
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'cmll', stage: 'lse' }));
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'lse', stage: 'solved' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":["lp"],"ss-front":["lp"],"lp":["cmll"],"cmll":["lse"],"lse":["solved"]}'
		);
		nextState = methods(nextState, remove_stage({ method: 'Fridrich', stage: 'lp' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":[],"ss-front":[]}'
		);
	});

	it('expects removing a stage to not remove dependents that are used by others', () => {
		let nextState = methods(initialState, new_method({ name: 'Fridrich', id: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
		nextState = methods(nextState, add_stage({ method: 'Fridrich', stage: 'fb' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{"scrambled":["fb"]}');
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-back' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-front' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"]}'
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-back', stage: 'lp' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-front', stage: 'lp' })
		);
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'lp', stage: 'cmll' }));
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'cmll', stage: 'lse' }));
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'lse', stage: 'solved' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":["lp"],"ss-front":["lp"],"lp":["cmll"],"cmll":["lse"],"lse":["solved"]}'
		);
		nextState = methods(nextState, remove_stage({ method: 'Fridrich', stage: 'ss-front' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back"],"ss-back":["lp"],"lp":["cmll"],"cmll":["lse"],"lse":["solved"]}'
		);
	});

	it('expects delete method to eradicate it', () => {
		let nextState = methods(initialState, new_method({ name: 'Fridrich', id: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
		nextState = methods(nextState, new_method({ name: 'CFOP', id: 'CFOP' }));
		expect(JSON.stringify(nextState.methodToStageMap)).to.equal('{"Fridrich":{},"CFOP":{}}');
		nextState = methods(nextState, delete_method('CFOP'));
		expect(JSON.stringify(nextState.methodToStageMap)).to.equal('{"Fridrich":{}}');
		expect(JSON.stringify(nextState.methodToNameMap)).to.equal('{"Fridrich":"Fridrich"}');
	});

	it('expects renaming a stage to reparent its dependents', () => {
		let nextState = methods(initialState, new_method({ name: 'Fridrich', id: 'Fridrich' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{}');
		nextState = methods(nextState, add_stage({ method: 'Fridrich', stage: 'fb' }));
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal('{"scrambled":["fb"]}');
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-back' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'fb', stage: 'ss-front' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"]}'
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-back', stage: 'lp' })
		);
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'ss-front', stage: 'lp' })
		);
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'lp', stage: 'cmll' }));
		nextState = methods(nextState, add_stage({ method: 'Fridrich', parent: 'cmll', stage: 'lse' }));
		nextState = methods(
			nextState,
			add_stage({ method: 'Fridrich', parent: 'lse', stage: 'solved' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":["lp"],"ss-front":["lp"],"lp":["cmll"],"cmll":["lse"],"lse":["solved"]}'
		);
		nextState = methods(
			nextState,
			rename_stage({ method: 'Fridrich', stage: 'lp', name: 'last_pair' })
		);
		expect(JSON.stringify(nextState.methodToStageMap['Fridrich'])).to.equal(
			'{"scrambled":["fb"],"fb":["ss-back","ss-front"],"ss-back":["last_pair"],"ss-front":["last_pair"],"cmll":["lse"],"lse":["solved"],"last_pair":["cmll"]}'
		);
	});
});
