<script lang="ts">
	import { Bomb, Completion, HomeOptions, Mission, MustHave, Operation } from '$lib/types';
	import { evaluateLogicalStringSearch, disappear, popup, titleCase } from '$lib/util';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from "svelte/store";
	import HomeOptionsMenu from './HomeOptionsMenu.svelte';
	import type { RepoModule } from '$lib/repo';
	import { getModule } from '$lib/../routes/mission/_shared';

	export let missions: Mission[];
	export let missionCards: { [name: string]: any } = {};
	export let modules: RepoModule[];
	export let validSearchOptions: boolean[] = [];
	export let searchOptionBoxes = ["names", "authors", "solved by", "invert"];
	export let resultsText = missions.length;

	let sortOrder: string = '';
	let reverse: boolean = false;
	let modulesInMission: { [name: string]: RepoModule[] } = {};
	let specialsInMission: { [name: string]: { [name: string]: RepoModule[] } } = {};
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
		updateSearch();
	}

	function onlyUnique(item:any, pos:number, self:any[]): boolean {
		return self.indexOf(item) == pos;
	}

	function bombSearchFilter(name:string, searchText:string): boolean {
		let text = searchText.toLowerCase();
		let searchWhat = '';
		let ms = missions.find(x => x.name == name) || missions[0];
		let modIDsInMission = modulesInMission[name].map(m => m.ModuleID).join(' ');
		if (searchOptions?.includes("names")) {
			if(options.checks["search-missname"]) searchWhat += ' ' + name.toLowerCase();
			if(options.checks["search-modname"])
				searchWhat += ' ' + modulesInMission[name].map(m => m.Name).join(' ').toLowerCase();
			if(options.checks["search-modid"])
				searchWhat += ' ' + modIDsInMission.toLowerCase();
		}
		if (searchOptions?.includes("authors"))
			searchWhat += ' ' + ms.authors.join(' ').toLowerCase();
		if (searchOptions?.includes("solved by")) {
			searchWhat += ' ' + ms.completions.map((x:Completion) => x.team).flat().filter(onlyUnique)
				.join(' ').toLowerCase() + (ms.tpSolve ? ' twitch plays':'');
		}
		let textMatch = evaluateLogicalStringSearch(text, searchWhat);
		
		let filtered = false;
		if (textMatch) {
			let time = timeSum(ms)/60;
			let mods = modSum(ms);
			let strk = Math.max(...ms.bombs.map((bomb) => bomb.strikes));
			let widg = Math.max(...ms.bombs.map((bomb) => bomb.widgets));
			
			filtered = time < options.time[0] || time > options.time[1] || mods < options.numMods[0] || mods > options.numMods[1] ||
				strk < options.strikes[0] || strk > options.strikes[1] || widg < options.widgets[0] || widg > options.widgets[1] ||
				!meetsHave(numCompletions(ms) > 0, options.mustHave['has-been-solved']) ||
				!meetsHave(specialsInMission[name]['boss'].length > 0, options.mustHave['has-boss']) ||
				!meetsHave(specialsInMission[name]['semi'].length > 0, options.mustHave['has-semi-boss']) ||
				!meetsHave(specialsInMission[name]['psdn'].length > 0, options.mustHave['has-pseudoneedy']) ||
				!meetsHave(specialsInMission[name]['need'].length > 0, options.mustHave['has-needy']);
			if (!filtered && options.modules["Operation"] != undefined) {
				filtered = options.modules["Operation"] != Operation.Defuser && percentFromEnabled(name) < options.profPerc[0] ||
					// options.modules["Operation"] == Operation.Combined &&
					// options.modules["EnabledList"].some((m:string) => !modIDsInMission.includes(m)) ||
					options.modules["Operation"] != Operation.Expert &&
					modulesInMission[name].some(m => (options.modules["DisabledList"] || []).includes(m.ModuleID));
			}
		}

		return searchOptions?.includes("invert") != (textMatch && !filtered);
	}

	function percentFromEnabled(msName:string): number {
		let percent = modulesInMission[msName].filter(m => (options.modules["EnabledList"] || []).includes(m.ModuleID))
			.length * 100 / modulesInMission[msName].length;
		// if (percent >= options.profPerc[0])
		// 	console.log(msName + ": " + percent);
		return percent;
	}

	function separateSpecialModules(msName:string): { [name: string]: any } {
		let bosses = modulesInMission[msName].filter(m => m.BossStatus);
		return {
			boss:bosses.filter(m => m.BossStatus == "FullBoss"),
			semi:bosses.filter(m => m.BossStatus == "SemiBoss"),
			psdn:modulesInMission[msName].filter(m => m.Quirks?.includes("PseudoNeedy")),
			reg:modulesInMission[msName].filter(m => m.Type == "Regular"),
			need:modulesInMission[msName].filter(m => m.Type == "Needy")
		};
	}

	function meetsHave(test:boolean, crit:MustHave) {
		return crit == MustHave.Either || (test && crit == MustHave.Yes) || (!test && crit == MustHave.No);
	}

	function timeSum(m:Mission) {
		return Math.max(...m.bombs.map(b => b.time));
	}
	function modSum(m:Mission) {
		return m.bombs.map(b => b.modules).reduce((a, b) => a + b, 0);
	}
	function ruleSeedPercent(m:Mission) {
		let rs = modulesInMission[m.name].map(m => m.RuleSeedSupport != null);
		return rs.filter(x => x).length / rs.length;
	}

	function numCompletions(m:Mission) { return m.completions.length + (m.tpSolve ? 1 : 0); }

	function compare(a:Mission, b:Mission, primary:(m:Mission)=>number, secondary:(m:Mission)=>number): boolean {
		let diff = primary(a) - primary(b);
		if (diff > 0)
			return true;
		else if (diff < 0)
			return false;
		else
			return secondary(a) > secondary(b);
	}

	function delayModulesCalculation(func: ()=>void, alt: ()=>void, time:number): boolean {
		if (Object.keys(modulesInMission).length != missions.length) {
			setTimeout(() => {
				if (Object.keys(modulesInMission).length == missions.length) func();
				else alt();
				dispatch('change');
			}, time);
			return false;
		}
		else {
			func();
			return true;
		}
	}

	function defaultSort() {
		missions.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() != reverse ? 1 : -1));
	}

	function homeOptionUpdate(event:any) {
		Object.assign(options, event.detail.op)
		console.log(options);
		if (sortOrder != options.sortOrder || reverse != options.checks["sort-reverse"]) {
			sortOrder = options.sortOrder;
			reverse = options.checks["sort-reverse"];
			let fastSort = true;
			switch(sortOrder) {
			case 'bomb-time':
				missions.sort((a, b) => (compare(a, b, timeSum, modSum) != reverse ? 1 : -1));
				break;
			case 'module-count':
				missions.sort((a, b) => (compare(a, b, modSum, timeSum) != reverse ? 1 : -1));
				break;
			case 'solves':
				missions.sort((a, b) => (compare(a, b, numCompletions, timeSum) != reverse ? 1 : -1));
				break;
			case 'rule-seeded-mods-%':
				fastSort = delayModulesCalculation(() => {
					missions.sort((a, b) => (ruleSeedPercent(a) > ruleSeedPercent(b) != reverse ? 1 : -1));
				}, defaultSort, 100);
				break;
			case 'expert-match':
				fastSort = delayModulesCalculation(() => {
					missions.sort((a, b) => (percentFromEnabled(a.name) > percentFromEnabled(b.name) != reverse ? 1 : -1));
				}, defaultSort, 100);
				break;
			default:
				defaultSort();
				break;
			}
			if (fastSort) dispatch('change');
		}
		updateSearch();
	}

	export const updateSearch = () => { layoutSearch.updateSearch(); }

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
		missions.forEach(m => {
			modulesInMission[m.name] = m.bombs.map((b:Bomb) => b.pools.map(p => p.modules.filter(onlyUnique))).flat(2).map(m => getModule(m, modules));
		});
		missions.forEach(m => {
			specialsInMission[m.name] = separateSpecialModules(m.name);
		});
		updateSearch();
	});
</script>

<div class="search-bar hstack">
	<span>Results: {resultsText}</span>
	<div class="spacer"></div>
	<LayoutSearchFilter id="bomb-search-field" label="Search:"
		title={searchTooltip} textArea rows={1} autoExpand
		bind:items={missionCards}
		filterFunc={bombSearchFilter}
		classes="help"
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
		on:click={() => prevDisap++} {modules}/>
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

	:global(.hstack.wrap) {
		flex-wrap: wrap;
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