<script lang="ts">
	import { browser } from '$app/environment';
	import Input from '$lib/controls/Input.svelte';
	import TextArea from '$lib/controls/TextArea.svelte';

	interface Props {
		id: string;
		label?: string;
		items: { [name: string]: any };
		filterFunc: (itemKey: string, text: string) => boolean;
		searchText?: string;
		rawSearchText?: string;
		title?: string;
		textArea?: boolean;
		rows?: number;
		class?: string;
		autoExpand?: boolean;
		numResults?: number;
		showNoneForBlank?: boolean;
		searching?: boolean;
		showAll?: boolean;
		resultLimit?: number;
		onchange?: () => void;
		oninput?: () => void;
	}

	let {
		id,
		label = 'Find:',
		items = $bindable(),
		filterFunc,
		searchText = $bindable(''),
		rawSearchText = $bindable(''),
		title = '',
		textArea = false,
		rows = 2,
		class: classes = '',
		autoExpand = false,
		numResults = $bindable(0),
		showNoneForBlank = false,
		searching = $bindable(false),
		showAll = $bindable(true),
		resultLimit = 50,
		onchange = () => {},
		oninput = () => {}
	}: Props = $props();

	let searchField: HTMLInputElement | null;

	function clearSearch() {
		rawSearchText = '';
		updateSearch();
		onchange();
		searchField?.focus();
	}

	export const updateSearch = () => {
		searching = false;
		searchText = rawSearchText.replace(/[\r\n]/g, ' ').trim();
		updateSearchFilter();
	};

	function updateSearchFilter() {
		numResults = 0;
		searching = true;
		Object.keys(items).forEach(item => {
			if (showNoneForBlank && searchText.length == 0) items[item]?.classList.add('search-filtered-out');
			else if (filterFunc(item, searchText)) {
				if (showAll || numResults < resultLimit) items[item]?.classList.remove('search-filtered-out');
				else items[item]?.classList.add('search-filtered-out');
				numResults++;
			} else items[item]?.classList.add('search-filtered-out');
		});
		searching = false;
		oninput();
	}

	if (browser) searchField = <HTMLInputElement>document.getElementById(id);
</script>

<div class="flex">
	{#if textArea}
		<TextArea
			{label}
			{id}
			{title}
			labelClass="help"
			sideLabel
			class="search-field help {classes}"
			oninput={updateSearch}
			{onchange}
			{autoExpand}
			{rows}
			bind:value={rawSearchText} />
	{:else}
		<Input
			{label}
			{id}
			{title}
			labelClass="help"
			sideLabel
			class="search-field help {classes}"
			oninput={updateSearch}
			{onchange}
			bind:value={rawSearchText} />
	{/if}
	<button class="reset search-field-clear dark-invert" onclick={clearSearch} aria-label="Clear search"></button>
</div>

<style>
	:global(.search-field) {
		min-width: 65px;
	}
	:global(.search-filtered-out) {
		display: none !important;
	}
	.flex {
		align-items: center;
	}

	.search-field-clear {
		background: url('$lib/img/clear-button.svg') right center no-repeat;
		width: 1.25em;
		height: 1.25em;
		min-width: 1.25em;
		display: inline-block;
		vertical-align: middle;
		cursor: pointer;
	}
</style>
