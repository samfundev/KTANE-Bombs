<script lang="ts">
	import { Bomb, Completion, HomeOptions, Mission, MustHave, Operation } from '$lib/types';
	import { evaluateLogicalStringSearch, disappear, popup, titleCase, getModule, onlyUnique } from '$lib/util';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import HomeFiltersMenu from './HomeFiltersMenu.svelte';
	import type { RepoModule } from '$lib/repo';

	export let missions: Mission[];
	export let missionCards: { [name: string]: any } = {};
	export let modules: Record<string, RepoModule>;
	export let validSearchOptions: boolean[] = [];
	export let searchOptionBoxes = ['mission', 'module', 'author', 'solver', 'invert'];
	export let resultsText = missions.length;

	let sortOrder: string = '';
	let reverse: boolean = false;
	let modulesInMission: { [name: string]: RepoModule[] } = {};
	let specialsInMission: { [name: string]: { [name: string]: RepoModule[] } } = {};
	let lStore: { [k: string]: Writable<any | null> } = {};
	let searchOptions: string[];
	let searchField: HTMLInputElement | null;
	let filters: HTMLDivElement;
	let filterTab: HTMLDivElement;
	let layoutSearch: LayoutSearchFilter;
	const defaultSearchOptions = [true, false, false, false, false];
	const searchTooltip =
		'Logical operators supported: &&(and), ||(or), !!(not)\n' +
		'Example: thing one && aaa || bbb && !!ccc\n' +
		'Which means: ("thing one" AND "aaa") OR ("bbb" AND NOT "ccc")\n' +
		'Brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]';

	let prevDisap = 0;
	let options = new HomeOptions();
	let dispatch = createEventDispatcher();

	function localSubscribe(item: any, key: string) {
		let wr = writable(item);
		wr.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value || ''));
		});
		lStore[key] = wr;
	}

	function setSearchOptions() {
		let options = searchOptionBoxes.filter((_, idx) => {
			return validSearchOptions[idx];
		});
		searchOptions = options;
		lStore['searchOptions'].set(searchOptions);
		searchOptionBoxes.forEach((o, i) => {
			validSearchOptions[i] = searchOptions.includes(o);
		});
		updateSearch();
	}

	function bombSearchFilter(name: string, searchText: string): boolean {
		let text = searchText.toLowerCase();
		let searchWhat = '';
		let ms = missions.find(x => x.name == name) || missions[0];

		if (searchOptions?.includes('mission')) searchWhat += ' ' + name.toLowerCase();
		if (searchOptions?.includes('module'))
			searchWhat +=
				' ' +
				modulesInMission[name]
					.map(m => m.Name)
					.join(' ')
					.toLowerCase();
		if (searchOptions?.includes('author')) searchWhat += ' ' + ms.authors.join(' ').toLowerCase();
		if (searchOptions?.includes('solver'))
			searchWhat +=
				' ' +
				ms.completions
					.map((x: Completion) => x.team)
					.flat()
					.filter(onlyUnique)
					.join(' ')
					.toLowerCase() +
				(ms.tpSolve ? ' twitch plays' : '');

		let textMatch = evaluateLogicalStringSearch(text, searchWhat);

		let filtered = false;
		if (textMatch) {
			let time = timeSum(ms) / 60;
			let mods = modSum(ms);
			let strk = Math.max(...ms.bombs.map(bomb => bomb.strikes));
			let widg = Math.max(...ms.bombs.map(bomb => bomb.widgets));

			filtered =
				time < options.time[0] ||
				time > options.time[1] ||
				mods < options.numMods[0] ||
				mods > options.numMods[1] ||
				strk < options.strikes[0] ||
				strk > options.strikes[1] ||
				widg < options.widgets[0] ||
				widg > options.widgets[1] ||
				!meetsHave(numCompletions(ms, false) > 0, options.mustHave['has-team/efm-solve']) ||
				!meetsHave(ms.tpSolve, options.mustHave['has-tp-solve']) ||
				!meetsHave(ms.designedForTP, options.mustHave['designed-for-tp']) ||
				!meetsHave(specialsInMission[name]['boss'].length > 0, options.mustHave['has-boss']) ||
				!meetsHave(specialsInMission[name]['semi'].length > 0, options.mustHave['has-semi-boss']) ||
				!meetsHave(specialsInMission[name]['psdn'].length > 0, options.mustHave['has-pseudoneedy']) ||
				!meetsHave(specialsInMission[name]['need'].length > 0, options.mustHave['has-needy']);
			if (!filtered && options.modules['Operation'] != undefined) {
				filtered =
					(options.modules['Operation'] != Operation.Defuser && percentFromEnabled(name) < options.profPerc[0]) ||
					(options.modules['Operation'] != Operation.Expert &&
						modulesInMission[name].some(m => (options.modules['DisabledList'] || []).includes(m.ModuleID)));
			}
		}

		return searchOptions?.includes('invert') != (textMatch && !filtered);
	}

	function percentFromEnabled(msName: string): number {
		let percent =
			(modulesInMission[msName].filter(m => (options.modules['EnabledList'] || []).includes(m.ModuleID)).length * 100) /
			modulesInMission[msName].length;
		// if (percent >= options.profPerc[0])
		// 	console.log(msName + ": " + percent);
		return percent;
	}

	function separateSpecialModules(msName: string): { [name: string]: any } {
		let bosses = modulesInMission[msName].filter(m => m.BossStatus);
		return {
			boss: bosses.filter(m => m.BossStatus == 'FullBoss'),
			semi: bosses.filter(m => m.BossStatus == 'SemiBoss'),
			psdn: modulesInMission[msName].filter(m => m.Quirks?.includes('PseudoNeedy')),
			reg: modulesInMission[msName].filter(m => m.Type == 'Regular'),
			need: modulesInMission[msName].filter(m => m.Type == 'Needy')
		};
	}

	function meetsHave(test: boolean, crit: MustHave) {
		return crit == MustHave.Either || (test && crit == MustHave.Yes) || (!test && crit == MustHave.No);
	}

	function timeSum(m: Mission) {
		return Math.max(...m.bombs.map(b => b.time));
	}
	function modSum(m: Mission) {
		return m.bombs.map(b => b.modules).reduce((a, b) => a + b, 0);
	}
	function ruleSeedPercent(m: Mission) {
		let rs = modulesInMission[m.name].map(m => m.RuleSeedSupport != null);
		return rs.filter(x => x).length / rs.length;
	}

	function numCompletions(m: Mission, countTP: boolean = true) {
		return m.completions.length + (countTP && m.tpSolve ? 1 : 0);
	}

	function compare(
		a: Mission,
		b: Mission,
		primary: (m: Mission) => number,
		secondary: (m: Mission) => number
	): boolean {
		let diff = primary(a) - primary(b);
		if (diff > 0) return true;
		else if (diff < 0) return false;
		else return secondary(a) > secondary(b);
	}

	function delayModulesCalculation(func: () => void, alt: () => void, time: number): boolean {
		if (Object.keys(modulesInMission).length != missions.length) {
			setTimeout(() => {
				if (Object.keys(modulesInMission).length == missions.length) func();
				else alt();
				dispatch('change');
			}, time);
			return false;
		} else {
			func();
			return true;
		}
	}

	function defaultSort() {
		missions.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() != reverse ? 1 : -1));
	}

	function homeOptionUpdate(event: any) {
		Object.assign(options, event.detail.op);
		// console.log(options);
		if (sortOrder != options.sortOrder || reverse != options.checks['sort-reverse']) {
			sortOrder = options.sortOrder;
			reverse = options.checks['sort-reverse'];
			let fastSort = true;
			switch (sortOrder) {
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
					fastSort = delayModulesCalculation(
						() => {
							missions.sort((a, b) => (ruleSeedPercent(a) > ruleSeedPercent(b) != reverse ? 1 : -1));
						},
						defaultSort,
						100
					);
					break;
				case 'expert-match':
					fastSort = delayModulesCalculation(
						() => {
							missions.sort((a, b) => (percentFromEnabled(a.name) > percentFromEnabled(b.name) != reverse ? 1 : -1));
						},
						defaultSort,
						100
					);
					break;
				default:
					defaultSort();
					break;
			}
			if (fastSort) dispatch('change');
		}
		updateSearch();
	}

	export const updateSearch = () => {
		layoutSearch.updateSearch();
	};

	onMount(() => {
		searchField = <HTMLInputElement>document.getElementById('bomb-search-field');
		searchField?.focus();
		document.onclick = () => {
			prevDisap = disappear(prevDisap);
		};
		let op = localStorage.getItem('searchOptions');
		searchOptions = JSON.parse(op || '[]');
		if (searchOptions.length > 0)
			searchOptionBoxes.forEach((o, i) => {
				validSearchOptions[i] = searchOptions.includes(o);
			});
		else {
			defaultSearchOptions.forEach((o, i) => {
				validSearchOptions[i] = o;
			});
			searchOptions = searchOptionBoxes.filter((_, i) => validSearchOptions[i]);
		}
		localSubscribe(searchOptions, 'searchOptions');
		missions.forEach(m => {
			modulesInMission[m.name] = m.bombs
				.map((b: Bomb) => b.pools.map(p => p.modules.filter(onlyUnique)))
				.flat(2)
				.map(m => getModule(m, modules));
		});
		missions.forEach(m => {
			specialsInMission[m.name] = separateSpecialModules(m.name);
		});
		updateSearch();
	});
</script>

<div class="search-bar hstack">
	<span>Results: {resultsText} of {missions.length}</span>
	<div class="spacer" />
	<LayoutSearchFilter
		id="bomb-search-field"
		label="Search:"
		title={searchTooltip}
		textArea
		rows={1}
		autoExpand
		bind:items={missionCards}
		filterFunc={bombSearchFilter}
		classes="help"
		bind:numResults={resultsText}
		bind:this={layoutSearch} />

	<div class="hstack boxes">
		{#each searchOptionBoxes as option, index}
			<Checkbox
				id="search-by-{option.replace(/ /g, '')}"
				label={titleCase(option)}
				sideLabel
				labelAfter
				on:change={setSearchOptions}
				bind:checked={validSearchOptions[index]} />
		{/each}
	</div>
	<div class="spacer" />
	<div
		class="tab filter-tab"
		bind:this={filterTab}
		on:click={event => {
			prevDisap = popup(event, filters, filterTab, prevDisap + 2, true);
		}}>
		Filters
	</div>
	<HomeFiltersMenu bind:div={filters} on:update={homeOptionUpdate} on:click={() => prevDisap++} {modules} />
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
	.search-bar > span {
		min-width: 100px;
	}
	.search-bar .spacer {
		width: 45px;
	}

	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
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
		box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	:global(.hidden) {
		display: none !important;
	}
	:global(#bomb-search-field) {
		width: 300px;
	}

	.filter-tab {
		background-image: url('$lib/img/filter-icon.png');
	}
	:global(.search-bar .tab) {
		display: inline-block;
		background-color: #eef;
		border: 1px solid #eef;
		border-bottom: none;
		border-top-color: #ccf;
		border-right-color: #ccf;
		border-right-width: 2px;
		border-top-left-radius: 0.5em;
		border-top-right-radius: 0.5em;
		text-decoration: none;
		color: #024;
		cursor: pointer;
		padding: 0.2em 0.5em 0.115em 28px;
		position: relative;
		top: 5px;
		margin-left: 0.2em;
		vertical-align: bottom;
		background-size: 20px 20px;
		background-position: 4px center;
		background-repeat: no-repeat;
		align-self: flex-end;
	}
</style>
