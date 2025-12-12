<script lang="ts">
	import { browser } from '$app/environment';
	import ModuleCard from '$lib/cards/ModuleCard.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import type { RepoModule } from '$lib/repo.js';
	import type { Bomb, Mission } from '$lib/types.svelte.js';
	import {
		evaluateLogicalStringSearch,
		getModule,
		logicalSearchTooltip,
		onlyUnique,
		properUrlEncode
	} from '$lib/util.js';
	import { onMount, untrack } from 'svelte';

	let { data } = $props();
	type ShortMission = Pick<Mission, 'name' | 'bombs'>;
	let missions: ShortMission[] = data.missions;
	let modules: Record<string, RepoModule> = data.modules;
	let moduleRows: any = $state({});
	let sortOption: 'alphabetical' | 'popular' | 'published' = $state('alphabetical');
	let layoutSearch: LayoutSearchFilter = $state();
	let showAll = $state(false);
	const resultLimit = 50;

	let missionsOf: Record<string, ShortMission[]> = $state({});
	missions.forEach(miss => {
		miss.bombs
			.map((b: Bomb) => b.pools.map(p => p.modules.filter(onlyUnique)))
			.flat(2)
			.map((m: string) => getModule(m, modules))
			.forEach((mod: RepoModule) => {
				if (missionsOf[mod.ModuleID] == undefined) {
					missionsOf[mod.ModuleID] = [miss];
				} else if (!missionsOf[mod.ModuleID].some(mission => mission.name === miss.name)) {
					missionsOf[mod.ModuleID].push(miss);
				}
			});
	});

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
		document.querySelectorAll('.missions-dropdown:not(.few)').forEach(el => {
			el.classList.remove('expand');
		});
	}
	function reveal(modID: string) {
		//if (missionsOf[modID]) console.log(missionsOf[modID].map(miss => miss.name));
		let elem = document.querySelector(`.missions-dropdown.mod${modID.replace(/\s/g, '')}`);
		elem?.classList.add('expand');
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
	{#each mods as [modID, module]}
		<div class="module-row flex row length-filtered-out" bind:this={moduleRows[modID]}>
			<div class="module-card flex column"><ModuleCard {module} /></div>
			<button
				class="reset missions-dropdown flex column mod{modID.replace(/\s/g, '')}"
				class:expand={!missionsOf[modID] || missionsOf[modID].length <= 4}
				class:few={!missionsOf[modID] || missionsOf[modID].length <= 4}
				onclick={() => reveal(modID)}>
				<div>
					<span>Missions: </span>
					{#if missionsOf[modID]}
						<span>{missionsOf[modID].length}</span>
						<div class="mission-list flex row wrap">
							{#each missionsOf[modID].toSorted((a, b) => a.name.localeCompare(b.name)) as miss}
								<a href="/mission/{properUrlEncode(miss.name)}">{miss.name}</a>
							{/each}
						</div>
						<div class="mission-list flex row short">
							{#each missionsOf[modID].toSorted((a, b) => a.name.localeCompare(b.name)).slice(0, 4) as miss}
								<span>{miss.name}</span>
							{/each}
							{#if missionsOf[modID].length > 4}
								<div class="bold">...</div>
							{/if}
						</div>
					{:else}
						<span>0</span>
					{/if}
				</div>
			</button>
		</div>
	{/each}
</div>

<style>
	.module-card {
		background-color: var(--foreground);
		width: 308px;
		justify-content: center;
	}
	:global(.module-card .module) {
		height: 100%;
	}
	.top-bar {
		position: sticky;
		top: calc(var(--stick-under-navbar) + 1px);
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
	.missions-dropdown:not(.expand) .mission-list.wrap,
	.missions-dropdown.expand .mission-list.short {
		display: none;
	}
	.mission-list > span {
		text-decoration: underline;
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
