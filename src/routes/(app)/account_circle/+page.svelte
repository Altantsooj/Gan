<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import { Content } from '@smui/card';
	import { store } from '$lib/store';
	import Select, { Option } from '@smui/select';
	import { set_solution_method } from '$lib/components/preferences';
	import firebase from '$lib/firebase';

	let hc: [string, string] = ['', 'Hardcoded Roux'];
	let options: [string, string][] = [hc];
	let method: [string, string] = hc;
	$: if ($store.methods.methodToNameMap) {
		options = [hc, ...Object.entries($store.methods.methodToNameMap)];
	}

	function methodSelected() {
		if (method) {
			firebase.dispatch(set_solution_method(method[0]));
		}
	}

	let lastSolutionMethodId = '';
	$: if ($store.preferences.solutionMethodId !== lastSolutionMethodId) {
		const ids = options.map((x) => x[0]);
		const index = ids.indexOf($store.preferences.solutionMethodId);
		if (index !== -1) {
			method = options[index];
			lastSolutionMethodId = $store.preferences.solutionMethodId;
		}
	}
</script>

<Content>
	<Select
		label="Solution Method"
		key={(option) => option && option.length === 2 && option[1]}
		bind:value={method}
		on:SMUISelect:change={methodSelected}
	>
		{#each options as option}
			<Option value={option}>{option[1]}</Option>
		{/each}
	</Select>
	<Login />
</Content>
