import { visualize } from '$lib/optimizer/optimizer';
import { store } from '$lib/store';
import { new_stage } from '$lib/components/stages';
import { analyze_roux_solve, get_oris } from '$lib/third_party/onionhoney/Analyzer';
import { CubeUtil, CubieCube, Mask, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
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
    function validateRouxReconstruction(solve: RouxRecord) {
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
   DDD`);
        expect(CubeUtil.is_solved(solvedCube, Mask.solved_mask)).to.be.true;
        const stages = analyze_roux_solve(scrambledCube, solution);
        expect(stages.length).to.equal(5);
        const [fb, ss, lp, cmll, lse] = [0,1,2,3,4]

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
    
    function setupSolutionsInStore() {
        store.dispatch(new_stage({ id: '0', name: 'fb', mask: Mask.fb_mask, orientations: get_oris('cn') }));
        store.dispatch(new_stage({ id: '1.0', name: 'ss_back', mask: Mask.ss_back_mask }));
        store.dispatch(new_stage({ id: '1.1', name: 'ss_front', mask: Mask.ss_front_mask }));
        store.dispatch(new_stage({ id: '2', name: 'lp', mask: Mask.sb_mask }));
        store.dispatch(new_stage({ id: '3', name: 'cmll', mask: Mask.cmll_mask }));
        store.dispatch(new_stage({ id: '4', name: 'lse', mask: Mask.lse_mask }));
        store.dispatch(new_stage({ id: '5', name: 'solved', mask: Mask.solved_mask }));
        expect(Object.keys(store.getState().stages.stageIdToStageMap).toString()).to.equal('0,2,3,4,5,1.0,1.1');
        store.dispatch(new_method({ id: '0', name: 'Roux'}));
        store.dispatch(add_stage({ method: '0', stage: '0' }))
        store.dispatch(add_stage({ method: '0', stage: '1.0', parent: '0' }))
        store.dispatch(add_stage({ method: '0', stage: '1.1', parent: '0' }))
        store.dispatch(add_stage({ method: '0', stage: '2', parent: '1.0' }))
        store.dispatch(add_stage({ method: '0', stage: '2', parent: '1.1' }))
        store.dispatch(add_stage({ method: '0', stage: '3', parent: '2' }))
        store.dispatch(add_stage({ method: '0', stage: '4', parent: '3' }))
        store.dispatch(add_stage({ method: '0', stage: '5', parent: '4' }))
        expect(store.getState().methods.methodToNameMap['0']).to.equal('Roux');
        expect(store.getState().methods.methodToStageMap['0']['0'].toString()).to.equal('1.0,1.1');
        expect(store.getState().methods.methodToStageMap['0']['1.0'].toString()).to.equal('2');
        expect(store.getState().methods.methodToStageMap['0']['1.1'].toString()).to.equal('2');
        expect(store.getState().stages.stageIdToStageMap['3'].name).to.equal('cmll');
    }

    it('fails to do a a custom analyze of a non-solution', () => {
        setupSolutionsInStore();
        try {
            analyzeSolve('Roux', "U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
                "B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2'");
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
        const breakdown = analyzeSolve('0', "U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
                    "B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2' U2");
        expect(!!breakdown).to.be.true;
        expect(breakdown.length).to.equal(6);
        expect(breakdown[0] !== undefined).to.be.true;
        if (breakdown[0]) {
            expect(breakdown[0].orientation?.toString()).to.equal("z y' ");
            expect(breakdown[0].solution.toString()).to.equal("B2 L2 B' L2 R' F R F2 S R2 B F' R' ");
            expect(breakdown[0].view?.toString()).to.equal("x' ");
            expect(breakdown[0].stage).to.equal("fb");
            expect(breakdown[0].rotatedSolution.toString()).to.equal("x' L2 F2 L' F2 B' R B R2 M' B2 L R' B' ");
        }
        expect(breakdown[1] !== undefined).to.be.true;
        if (breakdown[1]) {
            expect(breakdown[1].stage).to.equal("ss_front");
            expect(breakdown[1].orientation).to.be.undefined;
            expect(breakdown[1].view).to.be.undefined;
            expect(breakdown[1].rotatedSolution.toString()).to.equal("U2 R U R2 U' R' ");
        }
        expect(breakdown[2] !== undefined).to.be.true;
        if (breakdown[2]) {
            expect(breakdown[2].stage).to.equal("lp");
            expect(breakdown[2].orientation).to.be.undefined;
            expect(breakdown[2].view).to.be.undefined;
            // wrong because we are missing L -> r' moves
            expect(breakdown[2].rotatedSolution.toString()).to.equal("R L' B2 R' B' M2 B' L U' L' B' M2 B' L U L' B' L ");
        }
        expect(breakdown[3] !== undefined).to.be.true;
        if (breakdown[3]) {
            expect(breakdown[3].stage).to.equal("cmll");
            expect(breakdown[3].orientation).to.be.undefined;
            expect(breakdown[3].view).to.be.undefined;
            // wrong because it requires AUF
            expect(breakdown[3].rotatedSolution.toString()).to.equal("R U R' U R U2 R' U R U R' F' R U R' U' R' F R2 U' R' U ");
        }
        expect(breakdown[4] !== undefined).to.be.true;
        if (breakdown[4]) {
            expect(breakdown[4].stage).to.equal("lse");
            expect(breakdown[4].orientation).to.be.undefined;
            expect(breakdown[4].view).to.be.undefined;
            expect(breakdown[4].rotatedSolution.toString()).to.equal("M' U2 M U2 ");
        }
        expect(breakdown[5] !== undefined).to.be.true;
        if (breakdown[5]) {
            expect(breakdown[5].stage).to.equal("solved");
            expect(breakdown[5].orientation).to.be.undefined;
            expect(breakdown[5].view).to.be.undefined;
            expect(breakdown[5].rotatedSolution.toString()).to.equal("M U M' U' M' U2 M' U M2 U' M U2 M U2 M2 U2 ");
        }
    });

    it('has a hardcoded roux analyzer what works', () => {
        validateRouxReconstruction({
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
        });

    })
});