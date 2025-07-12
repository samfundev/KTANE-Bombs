<script lang="ts">
	import { Bomb, type Completion, HomeOptions, Mission, MustHave, Operation, type ID } from '$lib/types';
	import {
		evaluateLogicalStringSearch,
		popup,
		titleCase,
		getModule,
		onlyUnique,
		withoutArticle,
		preventDisappear,
		logicalSearchTooltip,
		isSpecialAllModule
	} from '$lib/util';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import HomeFiltersMenu from './HomeFiltersMenu.svelte';
	import type { RepoModule } from '$lib/repo';
	import { TP_TEAM } from '$lib/const';

	interface Props {
		missions: ID<Mission>[];
		missionCards?: { [name: string]: any };
		modules: Record<string, RepoModule>;
		validSearchOptions?: boolean[];
		searchOptionBoxes?: any;
		resultsText?: any;
		onchange?: () => void;
	}

	let {
		missions = $bindable(),
		missionCards = $bindable({}),
		modules,
		validSearchOptions = $bindable([false, false, false, false, false]),
		searchOptionBoxes = ['mission', 'module', 'author', 'solver', 'invert'],
		resultsText = $bindable(missions.length),
		onchange = () => {}
	}: Props = $props();

	let sortOrder: string = '';
	let reverse: boolean = false;
	let modulesInMission: { [name: string]: RepoModule[] } = {};
	let specialsInMission: { [name: string]: { [name: string]: RepoModule[] } } = {};
	let lStore: { [k: string]: Writable<any | null> } = {};
	let searchOptions: string[];
	let searchField: HTMLInputElement | null;
	let searchText: string = $state('');
	let filters: HTMLDivElement | null = $state(null);
	let filterTab = $state() as HTMLDivElement;
	let layoutSearch = $state() as LayoutSearchFilter;
	const defaultSearchOptions = [true, false, false, false, false];

	let options = new HomeOptions();

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

	function bombSearchFilter(name: string, query: string): boolean {
		let text = query.toLowerCase();
		let searchWhat: string[] = [];
		let ms = missions.find(x => x.name == name) || missions[0];

		if (searchOptions?.includes('mission')) searchWhat.push(name.toLowerCase());
		if (searchOptions?.includes('module')) searchWhat.push(...modulesInMission[name].map(m => m.Name.toLowerCase()));
		if (searchOptions?.includes('author')) searchWhat.push(...ms.authors.map(a => a.toLowerCase()));
		if (searchOptions?.includes('solver')) {
			searchWhat.push(
				...ms.completions
					.map((x: Completion) => x.team.map(mem => mem.toLowerCase()))
					.flat()
					.filter(onlyUnique)
			);
			if (ms.tpSolve) searchWhat.push('twitch plays');
		}

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
				!meetsHave(numCompletions(ms, false, false) > 0, options.mustHave['has-team/efm-solve']) ||
				!meetsHave(numSolos(ms) > 0, options.mustHave['has-solo-solve']) ||
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
			(modulesInMission[msName].filter(
				m =>
					(options.modules['EnabledList'] || []).includes(m.ModuleID) ||
					m.Origin === 'Vanilla' ||
					isSpecialAllModule(m.ModuleID)
			).length *
				100) /
			modulesInMission[msName].length;
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

	function numCompletions(m: Mission, countTP: boolean = true, countSolo: boolean = true) {
		return (
			m.completions.filter(c => c.team[0] != TP_TEAM && (countSolo || c.team.length > 1 || !c.solo)).length +
			(countTP && m.tpSolve ? 1 : 0)
		);
	}

	function numSolos(m: Mission) {
		return m.completions.filter(c => c.team.length == 1 && c.solo).length;
	}

	function compare(
		a: ID<Mission>,
		b: ID<Mission>,
		primary: (m: ID<Mission>) => number | undefined,
		secondary: (m: ID<Mission>) => number | string | undefined
	): boolean {
		let prim = [primary(a), primary(b)];
		let diff = prim[0] === undefined || prim[1] === undefined ? 0 : prim[0] - prim[1];
		if (diff > 0) return true;
		else if (diff < 0) return false;
		else {
			let sec = [secondary(a), secondary(b)];
			return sec[0] === undefined || sec[1] === undefined ? false : sec[0] > sec[1];
		}
	}

	function delayModulesCalculation(func: () => void, alt: () => void, time: number): boolean {
		if (Object.keys(modulesInMission).length != missions.length) {
			setTimeout(() => {
				if (Object.keys(modulesInMission).length == missions.length) func();
				else alt();
				onchange();
			}, time);
			return false;
		} else {
			func();
			return true;
		}
	}

	function defaultSort() {
		missions = missions.toSorted((a, b) =>
			withoutArticle(a.name.toLowerCase()).localeCompare(withoutArticle(b.name.toLowerCase())) > 0 != reverse ? 1 : -1
		);
	}

	function homeOptionUpdate(op: HomeOptions) {
		Object.assign(options, op);
		// console.log(options);
		if (sortOrder != options.sortOrder || reverse != options.checks['sort-reverse']) {
			sortOrder = options.sortOrder;
			reverse = options.checks['sort-reverse'];
			let fastSort = true;
			switch (sortOrder) {
				case 'total-time':
					missions = missions.toSorted((a, b) => (compare(a, b, timeSum, modSum) != reverse ? 1 : -1));
					break;
				case 'module-count':
					missions = missions.toSorted((a, b) => (compare(a, b, modSum, timeSum) != reverse ? 1 : -1));
					break;
				case 'solves':
					missions = missions.toSorted((a, b) => (compare(a, b, numCompletions, timeSum) != reverse ? 1 : -1));
					break;
				case 'date-added':
					missions = missions.toSorted((a, b) =>
						compare(
							a,
							b,
							m => m.dateAdded?.getTime(),
							m => m.id
						) != reverse
							? 1
							: -1
					);
					break;
				case 'bomb-count':
					missions = missions.toSorted((a, b) => (compare(a, b, m => m.bombs.length, timeSum) != reverse ? 1 : -1));
					break;
				case 'rule-seeded-mods-%':
					fastSort = delayModulesCalculation(
						() => {
							missions = missions.toSorted((a, b) => (ruleSeedPercent(a) > ruleSeedPercent(b) != reverse ? 1 : -1));
						},
						defaultSort,
						100
					);
					break;
				case 'expert-match':
					fastSort = delayModulesCalculation(
						() => {
							missions = missions.toSorted((a, b) =>
								percentFromEnabled(a.name) > percentFromEnabled(b.name) != reverse ? 1 : -1
							);
						},
						defaultSort,
						100
					);
					break;
				default:
					defaultSort();
					break;
			}
			if (fastSort) onchange();
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

<div class="search-bar flex">
	<div class="hstack controls">
		<span>Results: {resultsText} of {missions.length}</span>
		<LayoutSearchFilter
			id="bomb-search-field"
			label="Search:"
			title={logicalSearchTooltip}
			rows={1}
			textArea
			autoExpand
			bind:rawSearchText={searchText}
			bind:items={missionCards}
			filterFunc={bombSearchFilter}
			class="help"
			onchange={storeSearchText}
			bind:numResults={resultsText}
			bind:this={layoutSearch} />

		<div class="hstack boxes">
			{#each searchOptionBoxes as option, index}
				<Checkbox
					id="search-by-{option.replace(/ /g, '')}"
					label={titleCase(option)}
					sideLabel
					labelAfter
					onchange={setSearchOptions}
					bind:checked={validSearchOptions[index]} />
			{/each}
		</div>
	</div>
	<div class="flex control-tabs">
		<div bind:this={filterTab} class="popup-tab filter-tab" onclick={() => popup(filters, filterTab, true, [-100, 0])}>
			Filters
		</div>
	</div>
	<HomeFiltersMenu bind:div={filters} onclick={() => preventDisappear(filters)} onupdate={homeOptionUpdate} {modules} />
</div>

<style>
	.search-bar {
		position: sticky;
		background: var(--foreground);
		top: var(--stick-under-navbar);
	}
	.search-bar > .hstack {
		padding: 5px 0;
	}
	.search-bar > .hstack > span {
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
	.control-tabs {
		/* position: relative; */
		top: 5px;
	}

	:global(#bomb-search-field) {
		width: 300px;
	}

	.filter-tab {
		background-image: url('$lib/img/filter-icon.png');
	}
</style>
