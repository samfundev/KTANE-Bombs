<script lang="ts">
	import Checkbox from "$lib/controls/Checkbox.svelte";
	import Input from "$lib/controls/Input.svelte";
	import RadioButton from "$lib/controls/RadioButton.svelte";
	import type { RepoModule } from "$lib/repo";
	import { HomeOptions, MustHave, Operation } from "$lib/types";
	import { onMount, createEventDispatcher } from "svelte";
	import { writable, type Writable } from "svelte/store";

	export let modules: RepoModule[];
	export let div: HTMLDivElement | null = null;

	const dispatch = createEventDispatcher();
	let lStore: { [k:string]: Writable<any | null> } = {};
	let checks: { [k:string]: boolean } = {};
	let sortOrder: string = '';
	let operation = Operation.Combined;
	let profile: { [s:string]:any } = {};
	let mustHaves: { [k:string]: MustHave } = {};
	let limits: { [k:string]: number[] } = {};
	let files: FileList;
	let fileInput: HTMLInputElement;
	let hasOptions = ["Has Boss", "Has Semi-Boss", "Has PseudoNeedy", "Has Needy", "Has Been Solved"];
	let sortOptions = ["Alphabetical", "Module Count", "Bomb Time", "Solves", "Rule Seeded Mods %"];
	let limitDef: { [k:string]: number[] } = { mods: [1,600], time: [1,1500], strk: [1,150], widg: [0,40], prof: [80] };
	let checkDef: { [k:string]: boolean } = {
		"sort-reverse": false,
		"search-missname": true,
		"search-modname": false,
		"search-modid": false
	};

	function localSubscribe(item:any, key:string) {
		let wr = writable(item);
		wr.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value));
		});
		lStore[key] = wr;
	}

	let prevSortOrder = '';
	let preExpertSortOrder = '';	//sort order before switching to the special match% sort order for expert profiles
	let prefersMatchSort = true;
	const matchSort = "expert-match";
	
	function setOption() {
		Object.keys(checks).forEach((x:string) => {
			lStore[`option-${x}`]?.set(checks[x]);
		});
		Object.keys(mustHaves).forEach((x:string) => {
			lStore[`option-${x}`]?.set(mustHaves[x]);
		});
		lStore['option-sort-order']?.set(sortOrder);

		lStore['prefers-match-sort']?.set(prefersMatchSort);
		Object.keys(limits).forEach((x:string) => {
			lStore[`option-${x}-lim`]?.set(limits[x]);
		});
		lStore['imported-profile']?.set(profile);
		fireUpdate();
	}

	function setSortOrder() {
		if (profile["Operation"] != undefined && profile["Operation"] != Operation.Defuser) {
			if (sortOrder == matchSort) {
				preExpertSortOrder = prevSortOrder;
				prefersMatchSort = true;
			}
			else prefersMatchSort = false;
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
		Object.assign(op.profPerc, limits['prof']);
		Object.assign(op.modules, profile);
		dispatch('update', {
			op: op
		});
	}

	function removeNonRegNeedyMods(list:string[]) {
		let listC: string[] = [];
		Object.assign(listC, list);
		listC.forEach(mod => {
			let found = modules.find(x => x.ModuleID == mod);
			if (!found || (found.Type != "Regular" && found.Type != "Needy"))
				list.splice(list.findIndex(x => x == mod), 1);
		});
	}

	async function importProfile (file: File) {
		var fr = new FileReader();
		fr.readAsText(file);
		fr.onload = () => {
			let p = JSON.parse(<string>fr.result || '{}');
			if ("Operation" in p && (p["Operation"] == Operation.Combined && "DisabledList" in p && "EnabledList" in p ||
				p["Operation"] == Operation.Expert && "EnabledList" in p || p["Operation"] == Operation.Defuser && "DisabledList" in p
			)) {
				p["Name"] = file.name;
				operation = p["Operation"];

				if (operation == Operation.Defuser)
					delete p["EnabledList"];
				else {
					if (profile["Operation"] == undefined) preExpertSortOrder = sortOrder;
					if (prefersMatchSort) sortOrder = matchSort;
					removeNonRegNeedyMods(p["EnabledList"]);
				}

				if (operation == Operation.Expert)
					delete p["DisabledList"];
				else
					removeNonRegNeedyMods(p["DisabledList"]);

				profile = {};
				Object.assign(profile, p);
				profile == profile;
				setOption();
			}
			else {
				profile["Name"] = file.name;
				console.log("Operation:" + "Operation" in p);
				console.log("DisabledList:" + "DisabledList" in p);
				console.log("EnabledList:" + "EnabledList" in p);
			}
		};
	}

	function clearProfile() {
		if (prefersMatchSort && operation != Operation.Defuser) sortOrder = preExpertSortOrder;
		profile = {};
		setOption();
	}

	function toDashed(str:string): string {
		return str.replace(/ /g, "-").toLowerCase();
	}

	function integer (str:string): any { return parseInt(str); }
	function intnan (val:number): boolean | string { return isNaN(val) ? 'int' : (val >= 0 ? true : '≥0'); }
	function percent (val:number): boolean | string { return isNaN(val) ? 'int' : (val >= 0 && val <= 100 ? true : '0–100'); }

	function setDefaults() {
		sortOrder = preExpertSortOrder = "alphabetical";
		prefersMatchSort = true;
		Object.keys(checkDef).forEach((x:string) => { checks[x] = checkDef[x]; });
		hasOptions.forEach(x => { mustHaves[toDashed(x)] = MustHave.Either; });
		Object.keys(limitDef).forEach((x,i) => { limits[x] = limitDef[x].length > 1 ? [ limitDef[x][0], limitDef[x][1] ] : [ limitDef[x][0] ] });
		profile = {};
	}
	setDefaults();
	
	onMount(() => {
		Object.keys(checks).forEach((x:string) => {
			checks[x] = JSON.parse(localStorage.getItem(`option-${x}`) || JSON.stringify(checkDef[x]));
		});
		Object.keys(checks).forEach((x:string) => { localSubscribe(checks[x], `option-${x}`); });

		Object.keys(mustHaves).forEach((x:string) => {
			mustHaves[x] = JSON.parse(localStorage.getItem(`option-${x}`) || '0');
		});
		Object.keys(mustHaves).forEach((x:string) => { localSubscribe(mustHaves[x], `option-${x}`); });

		prevSortOrder = sortOrder = JSON.parse(localStorage.getItem('option-sort-order') || '"alphabetical"');
		localSubscribe(sortOrder, 'option-sort-order');
		prefersMatchSort = JSON.parse(localStorage.getItem('prefers-match-sort') || 'true');
		localSubscribe(prefersMatchSort, 'prefers-match-sort');

		Object.keys(limits).forEach((x:string) => {
			limits[x] = JSON.parse(localStorage.getItem(`option-${x}-lim`) || JSON.stringify(limitDef[x]));
		});
		Object.keys(limits).forEach((x:string) => { localSubscribe(limits[x], `option-${x}-lim`); });

		Object.assign(profile, JSON.parse(localStorage.getItem('imported-profile') || "{}"));
		localSubscribe(profile, 'imported-profile');
		operation = profile["Operation"] || Operation.Expert;
		profile = profile;
		setOption();
	});
</script>

<div class="popup disappear hidden" id="options"
	on:click bind:this={div}>
	<div class="hstack columns">
		<div>
			<span>Module Count</span>
			<div class="flex">
				<Input id="option-mcl" bind:value={limits["mods"][0]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
				<span class="through"></span>
				<Input id="option-mcu" bind:value={limits["mods"][1]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
			</div>
			<div class="vspace"></div>
			<span>Time (minutes)</span>
			<div class="flex">
				<Input id="option-tml" bind:value={limits["time"][0]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
				<span class="through"></span>
				<Input id="option-tmu" bind:value={limits["time"][1]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
			</div>
			<div class="vspace"></div>
			<span>Strikes</span>
			<div class="flex">
				<Input id="option-stkl" bind:value={limits["strk"][0]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
				<span class="through"></span>
				<Input id="option-stku" bind:value={limits["strk"][1]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
			</div>
			<div class="vspace"></div>
			<span>Widgets</span>
			<div class="flex">
				<Input id="option-wdgl" bind:value={limits["widg"][0]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
				<span class="through"></span>
				<Input id="option-wdgu" bind:value={limits["widg"][1]} classes="limits" parse={integer}
					validate={intnan} on:change={setOption}/>
			</div>
			<div class="vspace"></div>
			<span class="nowrap"><b class="qt">“</b>Names<b class="qt">”</b> search is:</span>
			<Checkbox id="option-search-missname" label="Mission Name"
				bind:checked={checks["search-missname"]}
				sideLabel labelAfter on:change={setOption}/>
			<Checkbox id="option-search-modname" label="Module Name"
				bind:checked={checks["search-modname"]}
				sideLabel labelAfter on:change={setOption}/>
			<Checkbox id="option-search-modid" label="Module ID"
				bind:checked={checks["search-modid"]}
				sideLabel labelAfter on:change={setOption}/>
		</div>
		<div class="center-divider"></div>
		<div>
			<button class="defaults" on:click={() => {
				setDefaults();
				setOption();
			}}>Defaults</button>
			<table>
			{#each hasOptions as op, index}
			<tr>
				<td class="row-header nowrap">{op}</td>
				<td><RadioButton id={`option-${toDashed(op)}-yes}`} label="Yes" value={MustHave.Yes} sideLabel
					name={`option-${toDashed(op)}`} bind:group={mustHaves[toDashed(op)]} on:change={setOption}/>
				</td>
				<td><RadioButton id={`option-${toDashed(op)}-no}`} label="No" value={MustHave.No} sideLabel
					name={`option-${toDashed(op)}`} bind:group={mustHaves[toDashed(op)]} on:change={setOption}/></td>
				<td><RadioButton id={`option-${toDashed(op)}-either}`} label="Either" value={MustHave.Either} sideLabel
					name={`option-${toDashed(op)}`} bind:group={mustHaves[toDashed(op)]} on:change={setOption}/></td>
			</tr>
			{/each}
			</table>
			<div class="vspace"></div>
			<div class="hstack">
				<span class="row-header nowrap">Sort by:</span>
				<Checkbox id="option-sort-reverse" label="Descending"
					bind:checked={checks["sort-reverse"]}
					sideLabel labelAfter on:change={setOption}/>
			</div>
			{#each sortOptions as op}
				<RadioButton id={`option-sort-${toDashed(op)}}`} label={op} value={toDashed(op)} sideLabel labelAfter
					name={'option-sort-order'} bind:group={sortOrder} on:change={setSortOrder}/>
			{/each}
			{#if profile["Operation"] != undefined && operation != Operation.Defuser}
				<RadioButton id={'option-sort-expertmatch'} label="Mods from profile %" value="expert-match" sideLabel labelAfter
					name={'option-sort-order'} bind:group={sortOrder} on:change={setSortOrder}/>
			{/if}
		</div>
	</div>
	<div class="vspace"></div>
	<div class="hstack gap">
		<span>Profile Filter:</span>
		<input class="hidden" id="profile-to-upload" type="file" accept=".json" bind:files bind:this={fileInput} on:change={() => importProfile(files[0])}/>
		<button on:click={ () => {fileInput.value = ''; fileInput.click()} }>Import</button>
		{#if profile["Operation"] != undefined}
			<button on:click={clearProfile}>Clear</button>
		{/if}
		<a href="https://ktane.timwi.de/More/Profile%20Editor.html" target="_blank">Profile Editor</a>
		{#if profile["Operation"] != undefined && profile["Operation"] != Operation.Defuser}
			<div class="hstack smallgap">
				<b>≥</b>
				<Input id="profile-percentage" bind:value={limits["prof"][0]} classes="percent" parse={integer}
					validate={percent} on:change={setOption}/>
				<span><b>%</b> from profile</span>
			</div>
		{/if}
	</div>
	{#if profile["Operation"] != undefined}
		<p class="explanation">
		{#if operation==Operation.Expert}
			Expert: A minimum percent of mods in the mission must be found in the <b class="qt">“</b>Yes<b class="qt">”</b> list
		{:else if operation==Operation.Defuser}
			Defuser: <b class="qt">“</b>No<b class="qt">”</b> mods can't show up on the mission
		{:else}
			Combined: A minimum percent of mods in the mission must be in the <b class="qt">“</b>Yes<b class="qt">”</b> list. <b class="qt">“</b>No<b class="qt">”</b> mods can't show up, others are not enforced
		{/if}
		</p>
		<div class="hstack gap wrap">
			<span><b>Profile:</b> {profile["Name"]},</span>
			<span><b>Type:</b> {Operation[operation]}</span>
		</div>
		<table>
			<tr><th><u>Yes</u></th><th><u>No</u></th></tr>
			<tr>
				<td class="top">
					<div class="module-list">
						{#if profile["EnabledList"]}
						{#each profile["EnabledList"] as mod}
							{mod}<br>
						{/each}
						{/if}
					</div>
				</td>
				<td class="top">
					<div class="module-list">
						{#if profile["DisabledList"]}
						{#each profile["DisabledList"] as mod}
							{mod}<br>
						{/each}
						{/if}
					</div>
				</td>
			</tr>
		</table>
	{:else if "Name" in profile}
	{Object.keys(profile)}
		<p><span class="error">Invalid profile!</span> {profile["Name"]}</p>
	{/if}
</div>

<style>
	p {
		margin: .3em 0;
		white-space: normal;
	}
	.explanation { width: 470px; }
	.hstack.gap { gap: 10px; }
	.hstack.smallgap { gap: 2px; }
	.vspace { height: 10px; }
	td.top { vertical-align: top; }
	:global(#options input.limits) { width: 50px; }
	:global(#options input.percent) { width: 33px; }
	.through {
		padding: 0 2px;
		line-height: 25px;
	}
	a {
		white-space: nowrap;
		color: blue;
	}
	.through::after { content: '—'; }
	.nowrap { white-space: nowrap; }
	b.qt {
		font-style: normal;
	}
	span.error {
		color: red;
		font-weight: bold;
	}
	.row-header { padding-right: 7px; }
	button { padding: 4px; }
	button.defaults {
		padding: 2px;
		line-height: 14px;
	}
	.columns {
		align-items: flex-start;
	}
	.center-divider {
		width: 0;
		height: 285px;
		border: 1px solid #00000066;
		margin: 0 .5em;
	}
	.popup table, .popup table td {
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
