import OptimizerWorker from '$lib/OptimizerWorker?worker';

export const prerender = true;
export const ssr = false;

export async function load() {
    return {
        optimizer: new OptimizerWorker()
    }
}
