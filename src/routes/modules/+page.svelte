<script lang="ts">
	import { browser } from '$app/environment';
	import ModuleCard from '$lib/cards/ModuleCard.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import type { RepoModule } from '$lib/repo.js';
	import type { Bomb, ID, Mission } from '$lib/types.js';
	import {
		allSpecialModules,
		evaluateLogicalStringSearch,
		getModule,
		logicalSearchTooltip,
		onlyUnique
	} from '$lib/util.js';

	export let data;
	type ShortMission = Pick<Mission, 'name' | 'bombs'>;
	let missions: ShortMission[] = data.missions;
	let modules: Record<string, RepoModule> = data.modules;
	let moduleRows: any = {};

	let missionsOf: Record<string, ShortMission[]> = {};
	missions.forEach(miss => {
		miss.bombs
			.map((b: Bomb) => b.pools.map(p => p.modules.filter(onlyUnique)))
			.flat(2)
			.map((m: string) => getModule(m, modules))
			.forEach((mod: RepoModule) => {
				if (missionsOf[mod.ModuleID] == undefined) {
					missionsOf[mod.ModuleID] = [miss];
				} else if (!(miss.name in missionsOf[mod.ModuleID])) {
					missionsOf[mod.ModuleID].push(miss);
				}
			});
	});

	function popular() {
		mods.sort((a, b) => (missionsOf[b[0]]?.length ?? 0) - (missionsOf[a[0]]?.length ?? 0));
		mods = mods;
		if (browser) {
			document.querySelector('.sort-option.alphabetical')?.classList.remove('selected');
			document.querySelector('.sort-option.popular')?.classList.add('selected');
		}
	}
	function alphabetical() {
		mods.sort((a, b) => {
			return a[1].Name.localeCompare(b[1].Name);
		});
		mods = mods;
		if (browser) {
			document.querySelector('.sort-option.popular')?.classList.remove('selected');
			document.querySelector('.sort-option.alphabetical')?.classList.add('selected');
		}
	}
	function closeeAll() {
		document.querySelectorAll('.missions-dropdown:not(.few)').forEach(el => {
			el.classList.remove('expand');
		});
	}
	function reveal(modID: string) {
		//if (missionsOf[modID]) console.log(missionsOf[modID].map(miss => miss.name));
		let elem = document.querySelector(`.missions-dropdown.mod${modID.replace(/\s/g, '')}`);
		elem?.classList.add('expand');
	}
	let mods = Object.entries(modules).filter(mod => mod[1].Type == 'Regular' || mod[1].Type == 'Needy');
	alphabetical();
	let resultsText: number = mods.length;

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
	<div class="legend flex">
		<span class="boss">Boss/Semi-Boss</span>
		<span class="needy">Needy</span>
		<span class="quirks">Has Other Quirks</span>
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
			filterFunc={moduleSearchFilter}
			classes="help" />
		<button on:click={closeeAll}>Close All</button>
		<span class="sort-option popular" on:click={popular}>Popular</span>
		<span class="sort-option selected alphabetical" on:click={alphabetical}>Alphabetical</span>
	</div>
</div>
<div class="flex column">
	{#each mods as [modID, module]}
		<div class="module-row flex row" bind:this={moduleRows[modID]}>
			<div class="module-card flex column"><ModuleCard {module} /></div>
			<div
				class="missions-dropdown flex column mod{modID.replace(/\s/g, '')}"
				class:expand={!missionsOf[modID] || missionsOf[modID].length <= 4}
				class:few={!missionsOf[modID] || missionsOf[modID].length <= 4}
				on:click={() => reveal(modID)}>
				<div class="">
					<span>Missions: </span>
					{#if missionsOf[modID]}
						<span>{missionsOf[modID].length}</span>
						<div class="mission-list flex row wrap">
							{#each missionsOf[modID].sort((a, b) => a.name.localeCompare(b.name)) as miss}
								<a href="/mission/{encodeURIComponent(miss.name)}">{miss.name}</a>
							{/each}
						</div>
						<div class="mission-list flex row short">
							{#each missionsOf[modID].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 4) as miss}
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
			</div>
		</div>
	{/each}
</div>

<style>
	.module-card {
		background-color: var(--foreground);
		width: 250px;
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
	}
	.bold {
		font-weight: bold;
	}
	.legend {
		justify-content: center;
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
</style>
