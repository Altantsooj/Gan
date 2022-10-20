<script lang="ts">
	import { Icon } from '@smui/icon-button';
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import List, { Item, Meta } from '@smui/list';
	import Textfield from '@smui/textfield';
	import { createEventDispatcher } from 'svelte';
	import Autocomplete from '@smui-extra/autocomplete';

	export let items: string[] = [];
	export let options: string[] | undefined = undefined;

	const dispatch = createEventDispatcher();

	function destroy(item: string, index: number) {
		return () => {
			dispatch('destroy', { item, index });
		};
	}
	let selected: number = -1;
	let newItem = '';
	let newItemText = '';
	function selectedEvent(e: CustomEvent) {
		newItemText = '';
		blur();
	}
	function blur() {
		dispatch('new', { item: newItem });
	}
	function select(i: number) {
		dispatch('select', { item: items[i], index: i });
	}
	function handleEnterKey(e: CustomEvent<any> | KeyboardEvent) {
		e = e as KeyboardEvent;
		if (e.key == 'Enter') {
			newItem = newItemText;
			newItemText = '';
			blur();
		}
	}
	function dontLoseSelection(e: CustomEvent) {
		e.preventDefault();
	}
</script>

<div class="list-border">
	<div class="list">
		<List>
			{#each items as method, i}
				<Item on:focus={() => select((selected = i))} on:blur={dontLoseSelection}
					><span class={i === selected ? 'selected' : ''}>{method}</span><Meta
						><span class="trash {i === selected ? 'selected' : ''}"
							><IconButton
								style="margin-right: -0.5em"
								class="material-icons"
								on:click={destroy(method, i)}>delete</IconButton
							></span
						></Meta
					></Item
				>
			{/each}
		</List>
	</div>
	<div class="spacer" />
	<div class="controls">
		{#if options}
			<Autocomplete
				{options}
				bind:value={newItem}
				bind:text={newItemText}
				on:SMUIAutocomplete:selected={selectedEvent}
				label="Add"
			>
				<Textfield bind:value={newItemText} label="Add">
					<Icon class="material-icons" slot="leadingIcon">add</Icon>
				</Textfield>
			</Autocomplete>
		{:else}
			<Textfield bind:value={newItemText} label="New" on:keydown={handleEnterKey}>
				<Icon class="material-icons" slot="leadingIcon">add</Icon>
			</Textfield>
		{/if}
	</div>
</div>

<style>
	.list-border:first-of-type {
		border-left: 1px solid #bbb;
	}
	.list-border {
		border: 1px solid #bbb;
		border-left: none;
		border-bottom: none;
		display: flex;
		flex-direction: column;
	}
	.spacer {
		flex-grow: 1;
	}
	.trash {
		opacity: 0.0001;
	}
	.trash:hover {
		opacity: 1;
	}
	.selected {
		opacity: 1;
		font-weight: bold;
	}
</style>
