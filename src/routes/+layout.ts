import OptimizerWorker from '$lib/OptimizerWorker?worker';
import { watchAll } from '$lib/actionlog';
import { onDestroy } from 'svelte';

export const prerender = true;
export const ssr = false;

export async function load() {
	async function watchDB() {
		let unsubMethods = await watchAll('methods');
		let unsubStages = await watchAll('stages');
		console.log('Subscribed to methods & stages');
		/*
		onDestroy(() => {
			unsubStages();
			unsubMethods();
			console.log("Unsubscribed to methods & stages");
		});
		*/
	}
	watchDB();

	return {
		optimizer: new OptimizerWorker()
	};
}
