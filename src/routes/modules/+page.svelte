<script lang="ts">
	import { browser } from '$app/environment';
	import ModuleCard from '$lib/cards/ModuleCard.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import type { RepoModule } from '$lib/repo.js';
	import { evaluateLogicalStringSearch, getModule, logicalSearchTooltip, properUrlEncode } from '$lib/util.js';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { data } = $props();
	let missionsOf = data.missionsOf;
	let modules: Record<string, RepoModule> = data.modules;
	let moduleRows: any = $state({});
	let sortOption: 'alphabetical' | 'popular' | 'published' = $state('alphabetical');
	let layoutSearch: LayoutSearchFilter = $state();
	let showAll = $state(false);
	const resultLimit = 50;
	const modsRevealed = new SvelteSet<string>();

	function limitResults() {
		let allRows = document.querySelectorAll('.module-row');
		allRows.forEach(function (row) {
			row.classList.remove('length-filtered-out');
		});
		console.log('showAll', showAll);
		if (!showAll) {
			let results = document.querySelectorAll('.module-row:not(.search-filtered-out)');
			for (let i = resultLimit; i < results.length; i++) {
				results[i].classList.add('length-filtered-out');
			}
		}
	}

	function updateSearch() {
		if (browser) {
			setTimeout(() => {
				layoutSearch?.updateSearch();
				limitResults();
			}, 100);
		}
	}
	function popular() {
		mods.sort((a, b) => (missionsOf[b[0]]?.length ?? 0) - (missionsOf[a[0]]?.length ?? 0));
		mods = mods;
		sortOption = 'popular';
		updateSearch();
	}
	function alphabetical() {
		mods.sort((a, b) => a[1].Name.localeCompare(b[1].Name));
		mods = mods;
		sortOption = 'alphabetical';
		updateSearch();
	}
	function published() {
		mods.sort((a, b) => new Date(b[1].Published).getTime() - new Date(a[1].Published).getTime());
		mods = mods;
		sortOption = 'published';
		updateSearch();
	}
	function closeAll() {
		modsRevealed.clear();
	}
	function reveal(modID: string) {
		modsRevealed.add(modID);
	}
	let mods = $state(Object.entries(modules).filter(mod => mod[1].Type == 'Regular' || mod[1].Type == 'Needy'));
	alphabetical();
	let resultsText: number = $state(untrack(() => mods.length));

	function moduleSearchFilter(name: string, searchText: string): boolean {
		let text = searchText.toLowerCase();
		let searchWhat: string[] = [];
		let modName = getModule(name, modules).Name;
		searchWhat.push(modName.toLowerCase());
		return evaluateLogicalStringSearch(text, searchWhat);
	}
</script>

<svelte:head>
	<title>Modules</title>
</svelte:head>
<div class="block">
	<h1 class="header">Modules</h1>
</div>
<div class="top-bar flex column block">
	<div class="flex">
		<div class="hstack">
			<span>Max {resultLimit} results shown</span>
			<Checkbox
				id="show-all-check"
				onchange={() => {
					updateSearch();
				}}
				bind:checked={showAll}
				label="Show All"
				sideLabel
				labelAfter />
		</div>

		<div class="legend flex">
			<span class="boss">Boss/Semi-Boss</span>
			<span class="needy">Needy</span>
			<span class="quirks">Has Other Quirks</span>
		</div>
	</div>
	<div class="flex row search-bar">
		<span>Results: {resultsText} of {mods.length}</span>
		<LayoutSearchFilter
			id="module-search-field"
			label="Search:"
			rows={1}
			textArea
			autoExpand
			title={logicalSearchTooltip}
			bind:items={moduleRows}
			bind:numResults={resultsText}
			bind:this={layoutSearch}
			filterFunc={moduleSearchFilter}
			oninput={limitResults}
			class="help" />
		<button onclick={closeAll}>Close All</button>
		<button class="reset sort-option alphabetical" class:selected={sortOption == 'alphabetical'} onclick={alphabetical}
			>Alphabetical</button>
		<button class="reset sort-option popular" class:selected={sortOption == 'popular'} onclick={popular}
			>Popular</button>
		<button class="reset sort-option published" class:selected={sortOption == 'published'} onclick={published}
			>Published</button>
	</div>
</div>
<div class="flex column">
	{#each mods as [modID, module] (modID)}
		<div class="module-row flex row length-filtered-out" bind:this={moduleRows[modID]}>
			<ModuleCard {module} />
			<button
				class="reset missions-dropdown mod{modID.replace(/\s/g, '')}"
				class:expand={!missionsOf[modID] || missionsOf[modID].length <= 4}
				onclick={() => reveal(modID)}>
				Missions: {missionsOf[modID] ? missionsOf[modID].length : 0}
				{#if missionsOf[modID]}
					{@const revealed = modsRevealed.has(modID)}
					{@const missions = revealed ? missionsOf[modID] : missionsOf[modID].slice(0, 4)}
					<div class="mission-list flex row" class:wrap={revealed} inert={missionsOf[modID].length > 4 && !revealed}>
						{#each missions as miss (miss)}
							<a href="/mission/{properUrlEncode(miss)}">{miss}</a>
						{/each}
						{#if !revealed && missionsOf[modID].length > 4}
							<div class="bold">...</div>
						{/if}
					</div>
				{/if}
			</button>
		</div>
	{/each}
</div>

<style>
	:global(.module-row .module) {
		background-color: var(--foreground);
		width: 308px;
	}
	.top-bar {
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.missions-dropdown {
		background-color: var(--foreground);
		width: 100%;
		justify-content: center;
		padding: var(--gap);
	}
	.missions-dropdown:not(.expand),
	.sort-option {
		cursor: pointer;
	}
	.mission-list {
		gap: 15px;
	}
	.mission-list.wrap {
		flex-wrap: wrap;
	}
	.search-bar {
		gap: 20px;
		align-items: center;
		flex-wrap: wrap;
	}
	.bold {
		font-weight: bold;
	}
	.hstack {
		display: flex;
		align-items: center;
	}
	.hstack > span {
		margin-right: 8px;
	}
	.legend {
		justify-content: center;
		flex: 1;
	}
	.legend > span {
		padding: var(--gap);
	}
	.sort-option:not(.selected) {
		cursor: pointer;
	}
	.sort-option.selected {
		text-decoration: underline;
		font-weight: bold;
		pointer-events: none;
	}
	:global(#module-search-field) {
		width: 250px;
	}
	.length-filtered-out {
		display: none;
	}
</style>
