<script lang="ts">
	import { Bomb, Completion, FilterableGroup, HomeOptions, Mission } from '$lib/types';
	import { evaluateLogicalStringSearch, disappear, popup, titleCase } from '$lib/util';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from "svelte/store";
	import HomeOptionsMenu from './HomeOptionsMenu.svelte';
	import type { RepoModule } from '$lib/repo';
	import { getModule } from '$lib/../routes/mission/_shared';

	export let group: FilterableGroup;
	export let modules: RepoModule[];
	export let validSearchOptions: boolean[] = [];
	export let searchOptionBoxes = ["names", "authors", "solved by", "invert"];
	export let resultsText = Object.keys(group.g).length;

	let modulesInMission: { [name: string]: RepoModule[] } = {};
	// let modsInMission: { [name: string]: string[] } = {};
	let lStore: { [k:string]: Writable<any | null> } = {};
	let searchOptions: string[];
	let searchField: HTMLInputElement | null;
	let filters: HTMLDivElement;
	let optionsTab: HTMLDivElement;
	let layoutSearch: LayoutSearchFilter;
	const defaultSearchOptions = [true, false, false, false];
	const searchTooltip =
		'Logical operators supported: &&(and), ||(or), !!(not)\n'+
		'Example: thing one && aaa || bbb && !!ccc\n'+
		'Which means: ("thing one" AND "aaa") OR ("bbb" AND NOT "ccc")\n'+
		'Brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]'

	let prevDisap = 0;
	let options = new HomeOptions();
	let dispatch = createEventDispatcher();

	function localSubscribe(item:any, key:string) {
		let wr = writable(item);
		wr.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value || ''));
		});
		lStore[key] = wr;
	}
	
	function setSearchOptions() {
		let options = searchOptionBoxes.filter((_, idx) => { return validSearchOptions[idx]; });
		searchOptions = options;
		lStore["searchOptions"].set(searchOptions);
		searchOptionBoxes.forEach((o, i) => {
			validSearchOptions[i] = searchOptions.includes(o);
		});
		layoutSearch.updateSearch();
	}

	function onlyUnique(item:any, pos:number, self:any[]): boolean {
		return self.indexOf(item) == pos;
	}

	function bombSearchFilter(ms:Mission, searchText:string) {
		let searchWhat = '';
		if (searchOptions?.includes("names")) {
			if(options.checks["search-missname"]) searchWhat += ' ' + ms.name.toLowerCase();
			if(options.checks["search-modname"])
				searchWhat += ' ' + modulesInMission[ms.name].map(m => m.Name).join(' ').toLowerCase();
			if(options.checks["search-modid"])
				searchWhat += ' ' + modulesInMission[ms.name].map(m => m.ModuleID).join(' ').toLowerCase();
		}
		if (searchOptions?.includes("authors"))
			searchWhat += ' ' + group.g.find(x => x.o.name == ms.name)?.o.authors.join(' ').toLowerCase();
		if (searchOptions?.includes("solved by")) {
			let m = group.g.find(x => x.o.name == ms.name);
			searchWhat += ' ' + m?.o.completions.map((x:Completion) => x.team).flat().filter(onlyUnique)
				.join(' ').toLowerCase() + (m?.o.tpSolve ? ' twitch plays':'');
		}

		return searchOptions?.includes("invert") != evaluateLogicalStringSearch(searchText, searchWhat);
	}

	function timeSum(bombs:Bomb[]) {
		return Math.max(...bombs.map(b => b.time));
	}
	function modSum(bombs:Bomb[]) {
		return bombs.map(b => b.modules).reduce((a, b) => a + b, 0);
	}

	function homeOptionUpdate(event:any) {
		Object.assign(options, event.detail.op)
		console.log(options);
		if (group.sortOrder != options.sortOrder || group.reverse != options.checks["sort-reverse"]) {
			group.sortOrder = options.sortOrder;
			group.reverse = options.checks["sort-reverse"];
			switch(group.sortOrder) {
			case 'bomb-time':
				group.g.sort((a, b) => (timeSum(a.o.bombs) > timeSum(b.o.bombs) != group.reverse ? 1 : -1));
				break;
			case 'module-count':
				if (Object.keys(modulesInMission).length == group.g.length)
				group.g.sort((a, b) => (modSum(a.o.bombs) > modSum(b.o.bombs) != group.reverse ? 1 : -1));
				break;
			default:
				group.g.sort((a, b) => (a.o.name.toLowerCase() > b.o.name.toLowerCase() != group.reverse ? 1 : -1));
				break;
			}
		}
		layoutSearch.updateSearch();
	}

	onMount(() => {
		searchField = <HTMLInputElement>document.getElementById("bomb-search-field");
		searchField?.focus();
		document.onclick = () => {
			prevDisap = disappear(prevDisap);
		}
		let op = localStorage.getItem("searchOptions");
		searchOptions = JSON.parse(op || '[]');
		if (searchOptions.length > 0)
			searchOptionBoxes.forEach((o, i) => { validSearchOptions[i] = searchOptions.includes(o); });
		else {
			defaultSearchOptions.forEach((o, i) => { validSearchOptions[i] = o; });
			searchOptions = searchOptionBoxes.filter((_,i) => validSearchOptions[i]);
		}
		localSubscribe(searchOptions, "searchOptions");
		group.g.forEach(m => {
			modulesInMission[m.o.name] = m.o.bombs.map((b:Bomb) => b.pools.map(p => p.modules)).flat(2).filter(onlyUnique).map((m:string) => getModule(m, modules));
			// modsInMission[m.o.name] = [""];
			// Object.assign(modsInMission[m.o.name], modulesInMission[m.o.name].map(m => m.Name));
		});
		// console.log(modsInMission);
		layoutSearch.updateSearch();
	});
</script>

<div class="search-bar hstack">
	<span>Results: {resultsText}</span>
	<div class="spacer"></div>
	<LayoutSearchFilter id="bomb-search-field" label="Search:"
		title={searchTooltip} textArea rows={1} autoExpand
		bind:items={group}
		on:change
		filterFunc={bombSearchFilter}
		bind:numResults={resultsText}
		bind:this={layoutSearch}/>
	
	<div class="hstack boxes">
	{#each searchOptionBoxes as option, index}
		<Checkbox id="search-by-{option.replace(/ /g,'')}"
			label={titleCase(option)}
			sideLabel labelAfter
			on:change={setSearchOptions}
			bind:checked={validSearchOptions[index]}/>
	{/each}
	</div>
	<div class="spacer"></div>
	<div class="tab options-tab"
		bind:this={optionsTab}
		on:click={(event) => {
			prevDisap = popup(event, filters, optionsTab, prevDisap + 2, true);
		}}>
		Options
	</div>
	<HomeOptionsMenu bind:div={filters} on:update={homeOptionUpdate}
		on:click={() => prevDisap++}/>
</div>

<style>
	.search-bar {
		position: sticky;
		background: var(--foreground);
		top: 44px;
		justify-content: center;
		gap: 3px;
		padding: 5px 0;
	}
	.search-bar > span { min-width: 100px; }
	.search-bar .spacer { width: 50px; }

	.hstack.boxes {
		flex-wrap: wrap;
		gap: 7px;
	}

	:global(.popup) {
		display: block;
		position: absolute;
		border: 1px solid black;
		padding: 1em;
		background: var(--popup-background);
		color: var(--text-color);
		box-shadow: 5px 5px 5px rgba(0,0,0,.3);
		z-index: 100;
	}
	
	:global(.hstack) {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	:global(.hidden) {
		display: none !important;
	}
	:global(#bomb-search-field) {
		width: 300px;
	}

	.options-tab {
		background-image: url('$lib/img/sliders.png');
	}
	:global(.search-bar .tab) {
		display: inline-block;
		background-color: #eef;
		border: 1px solid #eef;
		border-bottom: none;
		border-top-color: #ccf;
		border-right-color: #ccf;
		border-right-width: 2px;
		border-top-left-radius: .5em;
		border-top-right-radius: .5em;
		text-decoration: none;
		color: #024;
		cursor: pointer;
	    padding: .2em .5em .115em 28px;
		position: relative;
		top: 5px;
		margin-left: .2em;
		vertical-align: bottom;
		background-size: 20px 20px;
		background-position: 4px center;
		background-repeat: no-repeat;
		align-self: flex-end;
	}
</style>