import { analyzeSolve2 } from './components/MethodReconstruction';
import { makeOptimizedData } from './optimizer/optimizer';
import { store } from './store';
import type { MoveSeq } from './third_party/onionhoney/CubeLib';

onmessage = (m) => {
		console.log('Optimize request received: ', m.data);
		const scrambleString = m.data.scrambleString;
		const solutionString = m.data.solutionString;
		const methodId = m.data.methodId;
		const methods = m.data.methods;
		const stages = m.data.stages;
		store.getState().methods = methods;
		store.getState().stages = stages;
		const rstages = analyzeSolve2(methodId, scrambleString, solutionString, methods, stages);
		const ret = makeOptimizedData(scrambleString, rstages) as {
			orientation?: string;
			stage: string;
			solution: MoveSeq;
			score: number;
		}[][];
		postMessage(ret);
};

export {};
