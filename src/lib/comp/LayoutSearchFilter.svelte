<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import TextArea from '$lib/controls/TextArea.svelte';
	import { onMount, createEventDispatcher } from 'svelte';

	export let id: string;
	export let label: string = "Find:";
	export let items: { [name: string]: any };
	export let filterFunc: (itemKey:string, text:string) => boolean;
	export let searchText: string = '';
	export let title: string = '';
	export let textArea: boolean = false;
	export let rows: number = 2;
	export let classes: string = '';
	export let autoExpand: boolean = false;
	export let numResults: number = 0;
	export let showNoneForBlank: boolean = false;
	export let searching: boolean = false;
	
	const dispatch = createEventDispatcher();
	let searchField: HTMLInputElement | null;
	let rawSearchText: string = '';

	function clearSearch() {
		rawSearchText = '';
		Object.keys(items).forEach(name => {
			if (showNoneForBlank)
				items[name].classList.add("search-filtered-out");
			else
				items[name].classList.remove("search-filtered-out");
		});
		if (showNoneForBlank) numResults = 0;
		else numResults = Object.keys(items).length;
		dispatch('change');
		searchField?.focus();
	}

	export const updateSearch = () => {
		searching = false;
		searchText = rawSearchText.replace(/[\r\n]/g, ' ').trim();
		updateSearchFilter();
	}

	function updateSearchFilter() {
		numResults = 0;
		searching = true;
		Object.keys(items).forEach(item => {
			if (showNoneForBlank && searchText.length == 0)
				items[item]?.classList.add("search-filtered-out");
			else if (filterFunc(item, searchText)) {
				items[item]?.classList.remove("search-filtered-out");
				numResults++;
			}
			else
				items[item]?.classList.add("search-filtered-out");
		});
		searching = false;
		dispatch('change');
	}

	onMount(() => {
		searchField = <HTMLInputElement>document.getElementById(id);
	});
</script>

{#if textArea}
	<TextArea {label} {id} {title} sideLabel classes="search-field {classes}"
			on:input={updateSearch} {autoExpand} {rows}
			bind:value={rawSearchText}/>
{:else}
	<Input {label} {id} {title} sideLabel classes="search-field {classes}"
			on:input={updateSearch}
			bind:value={rawSearchText}/>
{/if}
<div class="search-field-clear dark-invert" on:click={clearSearch}></div>

<style>
	:global(.search-field) { min-width: 65px; }
	:global(.search-filtered-out) { display: none !important; }

	.search-field-clear {
		background: url('$lib/img/clear-button.svg') right center no-repeat;
		width: 1.25em;
		height: 1.25em;
		min-width: 1.25em;
		margin-right: 5px;
		display: inline-block;
		vertical-align: middle;
		cursor: pointer;
	}
</style>