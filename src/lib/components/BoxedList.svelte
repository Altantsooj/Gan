<script lang="ts">
	import { Icon } from '@smui/icon-button';
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import List, { Item } from '@smui/list';
	import Textfield from '@smui/textfield';
	import Select, { Option } from '@smui/select';
	import { createEventDispatcher } from 'svelte';
	import Autocomplete from '@smui-extra/autocomplete';

	export let items: string[] = [];
	export let options: string[] = [];

	const dispatch = createEventDispatcher();

	function destroy(item: string) {
		return () => {
			dispatch('destroy', { item });
		};
	}
	let selected: number = -1;
	let newItem = '';
	function blur() {
		dispatch('new', { item: newItem });
		newItem = '';
	}
	function select(i: index) {
		dispatch('select', { item: items[i], index: i });
	}
	function handleEnterKey(e: CustomEvent<any> | KeyboardEvent) {
		e = e as KeyboardEvent;
		if (e.key == 'Enter') {
			blur();
		}
	}
</script>

<div class="list-border">
	<List>
		{#each items as method, i}
			<Item on:focus={() => select((selected = i))} on:blur={(e) => e.preventDefault()}
				>{method}<span class="trash {i === selected ? 'selected' : ''}"
					><IconButton
						style="margin-right: -0.5em"
						class="material-icons"
						on:click={destroy(method)}>delete</IconButton
					></span
				></Item
			>
		{/each}
		<Item>
			<Textfield bind:value={newItem} label="New" on:keydown={handleEnterKey} on:blur={blur}>
				<Icon class="material-icons" slot="leadingIcon">add</Icon>
			</Textfield>
		</Item>
	</List>
</div>

<style>
	.list-border {
		border: 1px solid #bbb;
	}
	.trash {
		opacity: 0.0001;
	}
	.trash:hover {
		opacity: 1;
	}
	.selected {
		opacity: 1;
	}
</style>
