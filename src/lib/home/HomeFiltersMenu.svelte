<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import Input from '$lib/controls/Input.svelte';
	import RadioButton from '$lib/controls/RadioButton.svelte';
	import type { RepoModule } from '$lib/repo';
	import { HomeOptions, MustHave, Operation } from '$lib/types';
	import { excludeArticleSort, getModule, parseInteger } from '$lib/util';
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	interface Props {
		modules: Record<string, RepoModule>;
		div?: HTMLDivElement | null;
		onclick?: () => void;
		onupdate?: (options: HomeOptions) => void;
	}

	let { modules, div = $bindable(null), onclick = () => {}, onupdate = () => {} }: Props = $props();

	let lStore: { [k: string]: Writable<any | null> } = {};
	let checks: { [k: string]: boolean } = $state({});
	let sortOrder: string = $state('');
	let operation = $state(Operation.Combined);
	let profile: { [s: string]: any } = $state({});
	let mustHaves: { [k: string]: MustHave } = $state({});
	let limits: { [k: string]: number[] } = $state({});
	let files = $state() as FileList;
	let fileInput = $state() as HTMLInputElement;
	let filesValid = true;
	let yesList: string[] = $state([]);
	let noList: string[] = $state([]);
	let hasOptions = [
		'Has Team/EFM Solve',
		'Has Solo Solve',
		'Has TP Solve',
		'Has Boss',
		'Has Semi-Boss',
		'Has PseudoNeedy',
		'Has Needy',
		'Designed for TP'
	];
	let sortOptions = [
		'Alphabetical',
		'Date Added',
		'Module Count',
		'Bomb Count',
		'Solves',
		'Total Time',
		'Rule Seeded Mods %'
	];
	let limitDef: { [k: string]: number[] } = {
		mods: [1, 600],
		time: [1, 1800],
		strk: [1, 200],
		widg: [0, 50],
		bmbs: [1, 50],
		prof: [80]
	};
	let checkDef: { [k: string]: boolean } = {
		'sort-reverse': false,
		'persist-searchtext': true
	};
	let opExplain =
		'Expert: A minimum percent of mods in the mission must be found in the "Yes" list\n' +
		'Defuser: "No" mods cannot show up on the mission\n' +
		'Combined: A minimum percent of mods in the mission must be found in the "Yes" list,\n' +
		'                  "No" mods cannot show up, others are not enforced';

	function localSubscribe(item: any, key: string) {
		let wr = writable(item);
		wr.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value));
		});
		lStore[key] = wr;
	}

	let prevSortOrder = '';
	let preExpertSortOrder = ''; //sort order before switching to the special match% sort order for expert profiles
	let prefersMatchSort = true;
	const matchSort = 'expert-match';

	function setOption() {
		Object.keys(checks).forEach((x: string) => {
			lStore[`option-${x}`]?.set(checks[x]);
		});
		Object.keys(mustHaves).forEach((x: string) => {
			lStore[`option-${x}`]?.set(mustHaves[x]);
		});
		lStore['option-sort-order']?.set(sortOrder);

		lStore['prefers-match-sort']?.set(prefersMatchSort);
		Object.keys(limits).forEach((x: string) => {
			lStore[`option-${x}-lim`]?.set(limits[x]);
		});
		lStore['imported-profile']?.set(profile);
		fireUpdate();
	}

	function setSortOrder() {
		if (profile['Operation'] != undefined && profile['Operation'] != Operation.Defuser) {
			if (sortOrder == matchSort) {
				preExpertSortOrder = prevSortOrder;
				prefersMatchSort = true;
			} else prefersMatchSort = false;
		}
		prevSortOrder = sortOrder;
		setOption();
	}

	function fireUpdate() {
		let op = new HomeOptions();
		Object.assign(op.checks, checks);
		Object.assign(op.mustHave, mustHaves);
		op.sortOrder = sortOrder;
		Object.assign(op.time, limits['time']);
		Object.assign(op.numMods, limits['mods']);
		Object.assign(op.strikes, limits['strk']);
		Object.assign(op.widgets, limits['widg']);
		Object.assign(op.numBombs, limits['bmbs']);
		Object.assign(op.profPerc, limits['prof']);
		Object.assign(op.modules, $state.snapshot(profile));
		onupdate(op);
	}

	function removeNonRegNeedyMods(list: string[]) {
		let listC: string[] = [];
		Object.assign(listC, list);
		listC.forEach(mod => {
			let found = getModule(mod, modules);
			if (!found || (found.Type != 'Regular' && found.Type != 'Needy'))
				list.splice(
					list.findIndex(x => x == mod),
					1
				);
		});
	}

	function onlyUnique(item: any, pos: number, self: any[]): boolean {
		return self.indexOf(item) == pos;
	}

	function readFileAsText(file: Blob) {
		return new Promise(function (resolve, reject) {
			let fr = new FileReader();

			fr.onload = function () {
				resolve(fr.result);
			};

			fr.onerror = function () {
				reject(fr);
			};

			fr.readAsText(file);
		});
	}

	function updateYesNoLists() {
		noList = [];
		if (profile['DisabledList']) {
			Object.assign(noList, profile['DisabledList']);
			noList = noList.map(m => getModule(m, modules).Name).sort(excludeArticleSort);
		}
		yesList = [];
		if (profile['EnabledList']) {
			Object.assign(yesList, profile['EnabledList']);
			yesList = yesList.map(m => getModule(m, modules).Name).sort(excludeArticleSort);
		}
		profile = profile;
	}

	async function importProfile(files: FileList) {
		if (!files.length) return;

		let readers = [];
		for (let f = 0; filesValid && f < files.length; f++) readers.push(readFileAsText(files[f]));

		filesValid = true;
		Promise.all(readers).then(fl => {
			for (let f = 0; filesValid && f < fl.length; f++) {
				let name = files[f].name.replace(/\.[^/.]+$/, '');
				let p = JSON.parse(<string>fl[f] || '{}');
				if (
					'Operation' in p &&
					((p['Operation'] == Operation.Combined && 'DisabledList' in p && 'EnabledList' in p) ||
						(p['Operation'] == Operation.Expert && 'EnabledList' in p) ||
						(p['Operation'] == Operation.Defuser && 'DisabledList' in p))
				) {
					operation = p['Operation'];

					if (operation == Operation.Defuser) delete p['EnabledList'];
					else {
						if (profile['Operation'] == undefined) preExpertSortOrder = sortOrder;
						if (prefersMatchSort) sortOrder = matchSort;
						removeNonRegNeedyMods(p['EnabledList']);
					}

					if (operation == Operation.Expert) delete p['DisabledList'];
					else removeNonRegNeedyMods(p['DisabledList']);

					if (!profile['DisabledList']) profile['DisabledList'] = [];
					if (!profile['EnabledList']) profile['EnabledList'] = [];
					if (!profile['Name']) profile['Name'] = '';

					profile['Name'] = f == 0 && profile['Name'].length == 0 ? name : `${profile['Name']}, ${name}`;
					profile['Operation'] =
						profile['Operation'] == undefined || operation == profile['Operation'] ? operation : Operation.Combined;
					operation = profile['Operation'];

					if (p['DisabledList'])
						profile['DisabledList'] = profile['DisabledList'].concat(p['DisabledList']).filter(onlyUnique);
					if (p['EnabledList'])
						profile['EnabledList'] = profile['EnabledList'].concat(p['EnabledList']).filter(onlyUnique);

					updateYesNoLists();
					setOption();
				} else {
					profile['Name'] = name;
					console.log('Operation:' + 'Operation' in p);
					console.log('DisabledList:' + 'DisabledList' in p);
					console.log('EnabledList:' + 'EnabledList' in p);
					filesValid = false;
				}
			}
		});
	}

	function clearProfile() {
		if (prefersMatchSort && operation != Operation.Defuser) sortOrder = preExpertSortOrder;
		profile = {};
		setOption();
	}

	function toDashed(str: string): string {
		return str.replace(/ /g, '-').toLowerCase();
	}

	function intnan(val: number): boolean | string {
		return isNaN(val) ? 'int' : val >= 0 ? true : '≥0';
	}
	function percent(val: number): boolean | string {
		return isNaN(val) ? 'int' : val >= 0 && val <= 100 ? true : '0–100';
	}

	function setDefaults() {
		sortOrder = preExpertSortOrder = 'alphabetical';
		prefersMatchSort = true;
		Object.keys(checkDef).forEach((x: string) => {
			checks[x] = checkDef[x];
		});
		hasOptions.forEach(x => {
			mustHaves[toDashed(x)] = MustHave.Either;
		});
		Object.keys(limitDef).forEach((x, i) => {
			limits[x] = limitDef[x].length > 1 ? [limitDef[x][0], limitDef[x][1]] : [limitDef[x][0]];
		});
		profile = {};
	}
	setDefaults();

	onMount(() => {
		Object.keys(checks).forEach((x: string) => {
			checks[x] = JSON.parse(localStorage.getItem(`option-${x}`) || JSON.stringify(checkDef[x]));
		});
		Object.keys(checks).forEach((x: string) => {
			localSubscribe(checks[x], `option-${x}`);
		});

		Object.keys(mustHaves).forEach((x: string) => {
			mustHaves[x] = JSON.parse(localStorage.getItem(`option-${x}`) || '0');
		});
		Object.keys(mustHaves).forEach((x: string) => {
			localSubscribe(mustHaves[x], `option-${x}`);
		});

		prevSortOrder = sortOrder = JSON.parse(localStorage.getItem('option-sort-order') || '"alphabetical"');
		localSubscribe(sortOrder, 'option-sort-order');
		prefersMatchSort = JSON.parse(localStorage.getItem('prefers-match-sort') || 'true');
		localSubscribe(prefersMatchSort, 'prefers-match-sort');

		Object.keys(limits).forEach((x: string) => {
			limits[x] = JSON.parse(localStorage.getItem(`option-${x}-lim`) || JSON.stringify(limitDef[x]));
		});
		Object.keys(limits).forEach((x: string) => {
			localSubscribe(limits[x], `option-${x}-lim`);
		});

		Object.assign(profile, JSON.parse(localStorage.getItem('imported-profile') || '{}'));
		localSubscribe(profile, 'imported-profile');
		operation = profile['Operation'] || Operation.Expert;
		updateYesNoLists();
		setOption();
	});
</script>

<div class="popup disappear disappear-stat0 hidden" id="options" {onclick} bind:this={div}>
	<div class="hstack center">
		<button
			class="defaults"
			onclick={() => {
				setDefaults();
				setOption();
			}}>Reset to Defaults</button>
	</div>
	<div class="vspace"></div>
	<div class="hstack columns">
		<div>
			<span>Module Count</span>
			<div class="flex">
				<Input
					required
					name="option-mcl"
					id="option-mcl"
					bind:value={limits['mods'][0]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
				<span class="through"></span>
				<Input
					required
					name="option-mcu"
					id="option-mcu"
					bind:value={limits['mods'][1]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
			</div>
			<div class="vspace"></div>
			<span>Time (minutes)</span>
			<div class="flex">
				<Input
					required
					name="option-tml"
					id="option-tml"
					bind:value={limits['time'][0]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
				<span class="through"></span>
				<Input
					required
					name="option-tmu"
					id="option-tmu"
					bind:value={limits['time'][1]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
			</div>
			<div class="vspace"></div>
			<span>Strikes</span>
			<div class="flex">
				<Input
					required
					name="option-stkl"
					id="option-stkl"
					bind:value={limits['strk'][0]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
				<span class="through"></span>
				<Input
					required
					name="option-stku"
					id="option-stku"
					bind:value={limits['strk'][1]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
			</div>
			<div class="vspace"></div>
			<span>Widgets</span>
			<div class="flex">
				<Input
					required
					name="option-wdgl"
					id="option-wdgl"
					bind:value={limits['widg'][0]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
				<span class="through"></span>
				<Input
					required
					name="option-wdgu"
					id="option-wdgu"
					bind:value={limits['widg'][1]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
			</div>
			<div class="vspace"></div>
			<span>Bombs</span>
			<div class="flex">
				<Input
					required
					name="option-bmsl"
					id="option-bmsl"
					bind:value={limits['bmbs'][0]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
				<span class="through"></span>
				<Input
					required
					name="option-bmsu"
					id="option-bmsu"
					bind:value={limits['bmbs'][1]}
					class="limits"
					parse={parseInteger}
					validate={intnan}
					onchange={setOption} />
			</div>
			<div class="vspace"></div>
			<Checkbox
				id="option-persist-searchtext"
				label="Persist Query"
				bind:checked={checks['persist-searchtext']}
				sideLabel
				labelAfter
				onchange={setOption} />
		</div>
		<div class="center-divider"></div>
		<div>
			<table>
				<tbody>
					{#each hasOptions as op, index}
						{@const dashOp = toDashed(op)}
						<tr>
							<td class="row-header nowrap">{op}</td>
							<td>
								<RadioButton
									id="option-{dashOp}-yes"
									label="Yes"
									value={MustHave.Yes}
									sideLabel
									name="option-{dashOp}"
									bind:group={mustHaves[dashOp]}
									onchange={setOption} />
							</td>
							<td>
								<RadioButton
									id="option-{dashOp}-no"
									label="No"
									value={MustHave.No}
									sideLabel
									name="option-{dashOp}"
									bind:group={mustHaves[dashOp]}
									onchange={setOption} /></td>
							<td>
								<RadioButton
									id="option-{dashOp}-either"
									label="Either"
									value={MustHave.Either}
									sideLabel
									name="option-{dashOp}"
									bind:group={mustHaves[dashOp]}
									onchange={setOption} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div class="vspace"></div>
			<div class="hstack">
				<span class="row-header nowrap">Sort by:</span>
				<Checkbox
					id="option-sort-reverse"
					label="Descending"
					bind:checked={checks['sort-reverse']}
					sideLabel
					labelAfter
					onchange={setOption} />
			</div>
			{#each sortOptions as op}
				<RadioButton
					id={`option-sort-${toDashed(op)}}`}
					label={op}
					value={toDashed(op)}
					sideLabel
					labelAfter
					name={'option-sort-order'}
					bind:group={sortOrder}
					onchange={setSortOrder} />
			{/each}
			{#if profile['Operation'] != undefined && operation != Operation.Defuser}
				<RadioButton
					id={'option-sort-expertmatch'}
					label="Mods from profile %"
					value="expert-match"
					sideLabel
					labelAfter
					name={'option-sort-order'}
					bind:group={sortOrder}
					onchange={setSortOrder} />
			{/if}
		</div>
	</div>
	<div class="vspace"></div>
	<div class="hstack gap">
		<span title={opExplain} class="opexplain">Profile Filter:</span>
		<input
			class="hidden"
			id="profile-to-upload"
			type="file"
			multiple
			accept=".json"
			bind:files
			bind:this={fileInput}
			onchange={() => importProfile(files)} />
		<button
			onclick={() => {
				fileInput.value = '';
				fileInput.click();
			}}>
			{#if profile['Operation'] != undefined}
				Add
			{:else}
				Import
			{/if}
		</button>
		{#if profile['Operation'] != undefined}
			<button onclick={clearProfile}>Clear</button>
		{/if}
		<a href="https://ktane.timwi.de/More/Profile%20Editor.html" target="_blank">Profile Editor</a>
		{#if profile['Operation'] != undefined && profile['Operation'] != Operation.Defuser}
			<div class="hstack smallgap">
				<b>≥</b>
				<Input
					required
					name="profile-percentage"
					id="profile-percentage"
					bind:value={limits['prof'][0]}
					class="percent"
					parse={parseInteger}
					validate={percent}
					onchange={setOption} />
				<span><b>%</b> from profile</span>
			</div>
		{/if}
	</div>
	{#if profile['Operation'] != undefined}
		<div class="vspace"></div>
		<div class="hstack gap wrap">
			<span><b>Profile:</b> {profile['Name']}</span>
			<span><b>Type:</b> {Operation[operation]}</span>
		</div>
		<table>
			<tbody>
				<tr><th><u>Yes</u></th><th><u>No</u></th></tr>
				<tr>
					<td class="top">
						<div class="module-list">
							{#if profile['EnabledList']}
								{#each yesList as mod}
									{mod}<br />
								{/each}
							{/if}
						</div>
					</td>
					<td class="top">
						<div class="module-list">
							{#if profile['DisabledList']}
								{#each noList as mod}
									{mod}<br />
								{/each}
							{/if}
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	{:else if 'Name' in profile}
		{Object.keys(profile)}
		<p><span class="error">Invalid profile!</span> {profile['Name']}</p>
	{/if}
</div>

<style>
	p {
		margin: 0.3em 0;
		white-space: normal;
	}

	.opexplain {
		cursor: help;
	}

	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	.hstack.center {
		justify-content: center;
	}
	.hstack.wrap {
		flex-wrap: wrap;
	}
	.hstack.gap {
		gap: 10px;
	}
	.hstack.smallgap {
		gap: 2px;
	}
	.vspace {
		height: 10px;
	}
	td.top {
		vertical-align: top;
	}
	:global(#options input.limits) {
		width: 50px;
	}
	:global(#options input.percent) {
		width: 33px;
	}

	.through {
		padding: 0 2px;
		line-height: 25px;
	}
	a {
		white-space: nowrap;
		color: var(--blue-link-color);
	}

	.through::after {
		content: '—';
	}
	.nowrap {
		white-space: nowrap;
	}

	span.error {
		color: red;
		font-weight: bold;
	}

	.row-header {
		padding-right: 7px;
	}
	button {
		padding: 4px;
	}

	button.defaults {
		padding: 2px;
		line-height: 14px;
	}
	.columns {
		align-items: flex-start;
	}
	.center-divider {
		width: 0;
		height: 310px;
		border: 1px solid var(--light-text-color);
		margin: 0 0.8em;
	}
	.popup table,
	.popup table td {
		border: none;
	}
	.module-list {
		width: 220px;
		height: fit-content;
		max-height: 180px;
		border: 1px solid;
		padding: 2px;
		overflow: auto;
		background-color: var(--textbox-background);
		color: var(--textbox-text-color);
	}
</style>
