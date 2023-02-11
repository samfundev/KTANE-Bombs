<script lang="ts">
	import { Bomb, Completion, HomeOptions, Mission, MustHave, Operation, type ID } from '$lib/types';
	import {
		evaluateLogicalStringSearch,
		popup,
		titleCase,
		getModule,
		onlyUnique,
		withoutArticle,
		preventDisappear
	} from '$lib/util';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import HomeFiltersMenu from './HomeFiltersMenu.svelte';
	import type { RepoModule } from '$lib/repo';
	import { TP_TEAM } from '$lib/const';

	export let missions: ID<Mission>[];
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
	let searchText: string;
	let filters: HTMLDivElement;
	let filterTab: HTMLDivElement;
	let layoutSearch: LayoutSearchFilter;
	const defaultSearchOptions = [true, false, false, false, false];
	const searchTooltip =
		'Logical operators supported: &&(and), ||(or), !!(not)\n' +
		'Example: thing one && aaa || bbb && !!ccc\n' +
		'Which means: ("thing one" AND "aaa") OR ("bbb" AND NOT "ccc")\n' +
		'Brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]';

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
		lStore['home-search-options'].set(searchOptions);
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
			let strk = strikeSum(ms);
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
				ms.bombs.length < options.numBombs[0] ||
				ms.bombs.length > options.numBombs[1] ||
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
		return m.timeMode === 'Global'
			? Math.max(...m.bombs.map(bomb => bomb.time))
			: m.bombs.map(bomb => bomb.time).reduce((a, b) => a + b, 0);
	}
	function strikeSum(m: Mission) {
		return m.strikeMode === 'Global'
			? Math.max(...m.bombs.map(bomb => bomb.strikes))
			: m.bombs.map(bomb => bomb.strikes).reduce((a, b) => a + b, 0);
	}
	function modSum(m: Mission) {
		return m.bombs.map(b => b.modules).reduce((a, b) => a + b, 0);
	}
	function ruleSeedPercent(m: Mission) {
		let rs = modulesInMission[m.name].map(m => m.RuleSeedSupport != null);
		return rs.filter(x => x).length / rs.length;
	}

	function numCompletions(m: Mission, countTP: boolean = true) {
		return m.completions.filter(c => c.team[0] != TP_TEAM).length + (countTP && m.tpSolve ? 1 : 0);
	}

	function compare(
		a: ID<Mission>,
		b: ID<Mission>,
		primary: (m: ID<Mission>) => number | null,
		secondary: (m: ID<Mission>) => number | string | null
	): boolean {
		let prim = [primary(a), primary(b)];
		let diff = prim[0] === null || prim[1] === null ? 0 : prim[0] - prim[1];
		if (diff > 0) return true;
		else if (diff < 0) return false;
		else {
			let sec = [secondary(a), secondary(b)];
			return sec[0] === null || sec[1] === null ? false : sec[0] > sec[1];
		}
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
		missions.sort((a, b) =>
			withoutArticle(a.name.toLowerCase()).localeCompare(withoutArticle(b.name.toLowerCase())) > 0 != reverse ? 1 : -1
		);
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
				case 'date-added':
					missions.sort((a, b) =>
						compare(
							a,
							b,
							m => m.dateAdded,
							m => m.id
						) != reverse
							? 1
							: -1
					);
					break;
				case 'bomb-count':
					missions.sort((a, b) => (compare(a, b, m => m.bombs.length, timeSum) != reverse ? 1 : -1));
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
	function storeSearchText() {
		if (options.checks['persist-searchtext']) lStore['home-previous-search-text'].set(searchText);
	}

	onMount(() => {
		searchField = <HTMLInputElement>document.getElementById('bomb-search-field');
		searchField?.focus();
		let op = localStorage.getItem('home-search-options');
		if (options.checks['persist-searchtext'])
			searchText = JSON.parse(localStorage.getItem('home-previous-search-text') || JSON.stringify(''));
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
		localSubscribe(searchOptions, 'home-search-options');
		localSubscribe(searchText, 'home-previous-search-text');
		storeSearchText();
		missions.forEach(m => {
			modulesInMission[m.name] = m.bombs
				.map((b: Bomb) => b.pools.map(p => p.modules.filter(onlyUnique)))
				.flat(2)
				.map(m => getModule(m, modules));
		});
		missions.forEach(m => {
			specialsInMission[m.name] = separateSpecialModules(m.name);
		});
		options.checks['persist-searchtext'];
		updateSearch();
	});
</script>

<div class="search-bar">
	<div class="hstack controls">
		<span>Results: {resultsText} of {missions.length}</span>
		<LayoutSearchFilter
			id="bomb-search-field"
			label="Search:"
			title={searchTooltip}
			rows={1}
			textArea
			autoExpand
			bind:rawSearchText={searchText}
			bind:items={missionCards}
			filterFunc={bombSearchFilter}
			classes="help"
			on:change={storeSearchText}
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
	</div>
	<div class="tabs">
		<div bind:this={filterTab} class="popup-tab filter-tab" on:click={() => popup(filters, filterTab, false)}>
			Filters
		</div>
	</div>
</div>

<HomeFiltersMenu bind:div={filters} on:click={() => preventDisappear(filters)} on:update={homeOptionUpdate} {modules} />

<style>
	.search-bar {
		position: sticky;
		background: var(--foreground);
		top: calc(var(--stick-under-navbar) + 1px);
		padding: 5px 0;
	}
	.search-bar > .hstack > span {
		min-width: 100px;
		margin-left: var(--gap);
	}

	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		gap: 10px;
		flex-wrap: wrap;
	}
	.hstack.controls {
		justify-content: left;
		width: calc(100% - 90px);
	}
	.hstack.boxes {
		gap: 7px;
	}
	.tabs {
		position: absolute;
		display: flex;
		justify-content: right;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	:global(#bomb-search-field) {
		width: 300px;
	}

	.filter-tab {
		background-image: url('$lib/img/filter-icon.png');
	}
</style>
