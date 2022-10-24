import { makeOptimizedData, visualize } from '$lib/optimizer/optimizer';
import { store } from '$lib/store';
import { new_stage } from '$lib/components/stages';
import {
	analyze_roux_solve,
	get_oris,
	type SolutionDesc
} from '$lib/third_party/onionhoney/Analyzer';
import {
	CubeUtil,
	CubieCube,
	Mask,
	MoveSeq,
	type MaskT
} from '$lib/third_party/onionhoney/CubeLib';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { add_stage, new_method } from '$lib/components/methods';
import { analyzeSolve } from '$lib/components/MethodReconstruction';

describe('system can break down a solve into a good reconstruction of stages', () => {
	interface RouxRecord {
		scramble: string;
		original_solution: string;
		original_orientation: string;
		orientation: string;
		fb: string;
		ss: string;
		lp: string;
		cmll: string;
		lse: string;
	}
	function validateProvidedRouxReconstruction(solve: RouxRecord, stages: SolutionDesc[]) {
		const spin = new MoveSeq(solve.original_orientation);
		const scramble = new MoveSeq(solve.scramble);
		const solution = new MoveSeq(solve.original_solution);
		const scrambledCube = new CubieCube().apply(scramble);
		const solvedCube = scrambledCube.apply(solution).apply(spin);
		expect(visualize(solvedCube).substring(1)).to.equal(
			`  UUU
   UUU
   UUU
LLLFFFRRRBBB
LLLFFFRRRBBB
LLLFFFRRRBBB
   DDD
   DDD
   DDD`
		);
		expect(CubeUtil.is_solved(solvedCube, Mask.solved_mask)).to.be.true;
		expect(stages.length).to.equal(5);
		const [fb, ss, lp, cmll, lse] = [0, 1, 2, 3, 4];

		const view = stages[fb].view;
		if (view) {
			expect(view.inv() + ' ' + stages[fb].rotatedSolution).to.equal(solve.fb);
		} else {
			expect(stages[fb].rotatedSolution).to.equal(solve.fb);
		}
		expect(stages[ss].rotatedSolution.toString()).to.equal(solve.ss);
		expect(stages[lp].rotatedSolution.toString()).to.equal(solve.lp);
		expect(stages[cmll].rotatedSolution.toString()).to.equal(solve.cmll);
		expect(stages[lse].rotatedSolution.toString()).to.equal(solve.lse);
	}
	function validateRouxReconstruction(solve: RouxRecord) {
		const scramble = new MoveSeq(solve.scramble);
		const solution = new MoveSeq(solve.original_solution);
		const scrambledCube = new CubieCube().apply(scramble);
		const stages = analyze_roux_solve(scrambledCube, solution);
		validateProvidedRouxReconstruction(solve, stages);
	}

	function setupSolutionsInStore() {
		store.dispatch(
			new_stage({ id: '0', name: 'fb', mask: Mask.fb_mask, orientations: get_oris('cn') })
		);
		store.dispatch(
			new_stage({
				id: '0.1',
				name: 'fb',
				mask: Mask.fb_mask,
				orientations: get_oris('cn'),
				frozen_face: 'L'
			})
		);
		store.dispatch(new_stage({ id: '1.0', name: 'ss_back', mask: Mask.ss_back_mask }));
		store.dispatch(new_stage({ id: '1.1', name: 'ss_front', mask: Mask.ss_front_mask }));
		store.dispatch(new_stage({ id: '2', name: 'lp', mask: Mask.sb_mask }));
		store.dispatch(new_stage({ id: '3', name: 'cmll', mask: Mask.cmll_mask, free_face: 'U' }));
		store.dispatch(new_stage({ id: '4', name: 'lse', mask: Mask.lse_mask }));
		store.dispatch(new_stage({ id: '5', name: 'solved', mask: Mask.solved_mask }));
		const crossMask: MaskT = {
			cp: [0, 0, 0, 0, 0, 0, 0, 0],
			ep: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
			eo: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0]
		};
		const f2lMask: MaskT = {
			cp: [0, 0, 0, 0, 1, 1, 1, 1],
			co: [0, 0, 0, 0, 1, 1, 1, 1],
			ep: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
			eo: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
		};
		const ollMask: MaskT = {
			co: [1, 1, 1, 1, 1, 1, 1, 1],
			eo: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			cp: [0, 0, 0, 0, 1, 1, 1, 1],
			ep: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
		};

		store.dispatch(
			new_stage({ id: 'f0', name: 'cross', mask: crossMask, orientations: get_oris('cn') })
		);
		store.dispatch(new_stage({ id: 'f1', name: 'f2l', mask: f2lMask }));
		store.dispatch(new_stage({ id: 'f2', name: 'oll', mask: ollMask }));
		store.dispatch(new_stage({ id: 'f3', name: 'pll', mask: Mask.solved_mask }));

		expect(Object.keys(store.getState().stages.stageIdToStageMap).toString()).to.equal(
			'0,2,3,4,5,0.1,1.0,1.1,f0,f1,f2,f3'
		);
		store.dispatch(new_method({ id: '0', name: 'Roux' }));
		store.dispatch(add_stage({ method: '0', stage: '0' }));
		store.dispatch(add_stage({ method: '0', stage: '1.0', parent: '0' }));
		store.dispatch(add_stage({ method: '0', stage: '1.1', parent: '0' }));
		store.dispatch(add_stage({ method: '0', stage: '2', parent: '1.0' }));
		store.dispatch(add_stage({ method: '0', stage: '2', parent: '1.1' }));
		store.dispatch(add_stage({ method: '0', stage: '3', parent: '2' }));
		store.dispatch(add_stage({ method: '0', stage: '4', parent: '3' }));
		store.dispatch(add_stage({ method: '0', stage: '5', parent: '4' }));
		store.dispatch(new_method({ id: '1', name: 'Roux-HC' }));
		store.dispatch(add_stage({ method: '1', stage: '0.1' }));
		store.dispatch(add_stage({ method: '1', stage: '1.0', parent: '0.1' }));
		store.dispatch(add_stage({ method: '1', stage: '1.1', parent: '0.1' }));
		store.dispatch(add_stage({ method: '1', stage: '2', parent: '1.0' }));
		store.dispatch(add_stage({ method: '1', stage: '2', parent: '1.1' }));
		store.dispatch(add_stage({ method: '1', stage: '3', parent: '2' }));
		store.dispatch(add_stage({ method: '1', stage: '5', parent: '3' }));
		expect(store.getState().methods.methodToNameMap['0']).to.equal('Roux');
		expect(store.getState().methods.methodToStageMap['0']['0'].toString()).to.equal('1.0,1.1');
		expect(store.getState().methods.methodToStageMap['0']['1.0'].toString()).to.equal('2');
		expect(store.getState().methods.methodToStageMap['0']['1.1'].toString()).to.equal('2');
		expect(store.getState().stages.stageIdToStageMap['3'].name).to.equal('cmll');

		store.dispatch(new_method({ id: 'f1', name: 'Fridrich' }));
		store.dispatch(add_stage({ method: 'f1', stage: 'f0' }));
		store.dispatch(add_stage({ method: 'f1', stage: 'f1', parent: 'f0' }));
		store.dispatch(add_stage({ method: 'f1', stage: 'f2', parent: 'f1' }));
		store.dispatch(add_stage({ method: 'f1', stage: 'f3', parent: 'f2' }));
	}
	function validateGenericRouxReconstruction(solve: RouxRecord) {
		const stages = analyzeSolve('1', solve.scramble, solve.original_solution);
		validateProvidedRouxReconstruction(solve, stages);
	}

	it('fails to do a a custom analyze of a non-solution', () => {
		setupSolutionsInStore();
		try {
			analyzeSolve(
				'Roux',
				"U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
				"B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2'"
			);
		} catch (e) {
			expect(e).to.equal(`Cube
   LLL
   LLL
   LLL
UUUBBBDDDFFF
DDDFFFUUUBBB
DDDFFFUUUBBB
   RRR
   RRR
   RRR
does not look solved`);
		}
	});

	it('custom analyzer can find the fb', () => {
		setupSolutionsInStore();
		const breakdown = analyzeSolve(
			'0',
			"U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
			"B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2' U2"
		);
		expect(!!breakdown).to.be.true;
		expect(breakdown.length).to.equal(6);
		expect(breakdown[0] !== undefined).to.be.true;
		if (breakdown[0]) {
			expect(breakdown[0].orientation?.toString()).to.equal("z y' ");
			expect(breakdown[0].solution.toString()).to.equal("B2 L2 B' L2 R' F R F2 S R2 B F' R' ");
			expect(breakdown[0].view?.toString()).to.equal('x ');
			expect(breakdown[0].stage).to.equal('fb');
			expect(breakdown[0].rotatedSolution.toString()).to.equal(
				"L2 F2 L' F2 B' R B R2 M' B2 L R' B' "
			);
		}
		expect(breakdown[1] !== undefined).to.be.true;
		if (breakdown[1]) {
			expect(breakdown[1].stage).to.equal('ss_front');
			expect(breakdown[1].orientation).to.be.undefined;
			expect(breakdown[1].view).to.be.undefined;
			expect(breakdown[1].rotatedSolution.toString()).to.equal("U2 R U R2 U' R' ");
		}
		expect(breakdown[2] !== undefined).to.be.true;
		if (breakdown[2]) {
			expect(breakdown[2].stage).to.equal('lp');
			expect(breakdown[2].orientation).to.be.undefined;
			expect(breakdown[2].view).to.be.undefined;
			// wrong because we are missing L -> r' moves
			expect(breakdown[2].rotatedSolution.toString()).to.equal(
				"R L' B2 R' B' M2 B' L U' L' B' M2 B' L U L' B' L "
			);
		}
		expect(breakdown[3] !== undefined).to.be.true;
		if (breakdown[3]) {
			expect(breakdown[3].stage).to.equal('cmll');
			expect(breakdown[3].orientation).to.be.undefined;
			expect(breakdown[3].view).to.be.undefined;
			expect(breakdown[3].rotatedSolution.toString()).to.equal(
				"R U R' U R U2 R' U R U R' F' R U R' U' R' F R2 U' R' "
			);
		}
		expect(breakdown[4] !== undefined).to.be.true;
		if (breakdown[4]) {
			expect(breakdown[4].stage).to.equal('lse');
			expect(breakdown[4].orientation).to.be.undefined;
			expect(breakdown[4].view).to.be.undefined;
			expect(breakdown[4].rotatedSolution.toString()).to.equal('U ');
		}
		expect(breakdown[5] !== undefined).to.be.true;
		if (breakdown[5]) {
			expect(breakdown[5].stage).to.equal('solved');
			expect(breakdown[5].orientation).to.be.undefined;
			expect(breakdown[5].view).to.be.undefined;
			expect(breakdown[5].rotatedSolution.toString()).to.equal(
				"M' U2 M U2 M U M' U' M' U2 M' U M2 U' M U2 M U2 M2 U2 "
			);
		}
	});

	const solve = {
		scramble: "U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
		original_solution:
			"B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2' U2",
		original_orientation: "z'",
		orientation: "z y' ",
		fb: "x'  L2 F2 L' F2 B' R B R2 M' B2 L R' B' ",
		ss: "U2 R U R2 U' R' ",
		lp: "R r' U2 R' U' M2 U' r U' r' U' M2 U' r U r' U' r ",
		cmll: "R U R' U R U2 R' U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "U M' U2 M U2 M U M' U' M' U2 M' U M2 U' M U2 M U2 M2 U2 "
	};
	it('custom analyzer can match the hardcoded analyzer', () => {
		setupSolutionsInStore();
		validateGenericRouxReconstruction(solve);
	});

	it('has a hardcoded roux analyzer what works', () => {
		validateRouxReconstruction(solve);
	});

	interface FridrichRecord {
		scramble: string;
		original_solution: string;
		original_orientation: string;
		orientation: string;
		cross: string;
		f2l: string;
		oll: string;
		pll: string;
	}
	function validateProvidedFridrichReconstruction(solve: FridrichRecord, stages: SolutionDesc[]) {
		const spin = new MoveSeq(solve.original_orientation);
		const scramble = new MoveSeq(solve.scramble);
		const solution = new MoveSeq(solve.original_solution);
		const scrambledCube = new CubieCube().apply(scramble);
		const solvedCube = scrambledCube.apply(solution).apply(spin);
		expect(visualize(solvedCube).substring(1)).to.equal(
			`  UUU
   UUU
   UUU
LLLFFFRRRBBB
LLLFFFRRRBBB
LLLFFFRRRBBB
   DDD
   DDD
   DDD`
		);
		expect(CubeUtil.is_solved(solvedCube, Mask.solved_mask)).to.be.true;
		//expect(stages.length).to.equal(4);
		const [cross, f2l, oll, pll] = [0, 1, 2, 3];

		const view = stages[cross].view;
		if (view) {
			expect(view.inv() + ' ' + stages[cross].rotatedSolution).to.equal(solve.cross);
		} else {
			expect(stages[cross].rotatedSolution.toString()).to.equal(solve.cross);
		}
		expect(stages[cross].orientation).to.equal(solve.orientation);
		expect(stages[f2l].rotatedSolution.toString()).to.equal(solve.f2l);
		expect(stages[oll].rotatedSolution.toString()).to.equal(solve.oll);
		expect(stages[pll].rotatedSolution.toString()).to.equal(solve.pll);
	}
	const fridrichSolve = {
		scramble: "F L2 B2 R2 F2 D' B2 U' B2 D2 L D R B' U2 B' L' D2",
		original_solution:
			"z2 F2 U2 L F' U l U' l' U2 R U R' D U l U L' U' M' D' U2 R U2 R' U' R U R' U F U' R U R' U2 F' U' F R U' R' U' R U R' F' x R2' D2 R U R' D2 R U' R B2",
		original_orientation: "y2 x'",
		orientation: 'x2 ',
		cross: "x2 y2  z2 B2 U2 R B' U r U' r' ",
		f2l: "U2 L U L' D U r U R' U' M D' U2 L U2 L' U' L U L' U B U' L U L' U2 B' ",
		oll: "U' B L U' L' U' L U L' B' ",
		pll: "x' L2 D2 L U L' D2 L U' L F2 "
	};

	it('custom analyzer can reconstruct a Fridrich solve', () => {
		setupSolutionsInStore();
		const stages = analyzeSolve('f1', fridrichSolve.scramble, fridrichSolve.original_solution);
		validateProvidedFridrichReconstruction(fridrichSolve, stages);
	});

	it('custom analyzer solve can be optimized', () => {
		setupSolutionsInStore();
		const scramble = "U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D";
		const breakdown = analyzeSolve(
			'0',
			scramble,
			"B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2' U2"
		);
		const optimized = makeOptimizedData(scramble, breakdown);
		expect(optimized.length).to.equal(6);
		expect(optimized[0].length).to.equal(2);
		expect(optimized[0][0].solution.toString()).to.equal("F' M' U M F B ");
		expect(optimized[0][1].solution.toString()).to.equal("M' F' U M F B ");
		expect(optimized[1].length).to.equal(2);
		expect(optimized[1][0].solution.toString()).to.equal("R U2 R' U2 R' ");
		expect(optimized[1][1].solution.toString()).to.equal("U R U R' U' R' ");
		expect(optimized[2].length).to.equal(2);
		expect(optimized[2][0].solution.toString()).to.equal("U2 r U M2 U' R ");
		expect(optimized[2][1].solution.toString()).to.equal("r' U2 R U' r2 U R ");
		expect(optimized[3].length).to.equal(0);
		//expect(optimized[3][0].solution.toString()).to.equal("U2 F' R U R ");
		//expect(optimized[3][1].solution.toString()).to.equal("D' F2 B' U' ");
		expect(optimized[4].length).to.equal(1);
		expect(optimized[4][0].solution.toString()).to.equal(' ');
		expect(optimized[5].length).to.equal(2);
		expect(optimized[5][0].solution.toString()).to.equal("U r U R' U M2 U R U R' ");
		expect(optimized[5][1].solution.toString()).to.equal("U R' U2 r' U R2 U r' U2 r' ");
	});
});
