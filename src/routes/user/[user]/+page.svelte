<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import Select from '$lib/controls/Select.svelte';
	import { IndividualCompletion, Mission, MissionCompletion, Permission, type FrontendUser } from '$lib/types';
	import { getPersonColor, hasPermission, pluralize, withoutArticle } from '$lib/util';
	import UserPermissions from '../_UserPermissions.svelte';
	import { page } from '$app/stores';
	import MissionCompletionCard from '$lib/cards/MissionCompletionCard.svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import { TP_TEAM } from '$lib/const';
	import type { Completion, MissionPack } from '@prisma/client';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	export let data;

	type SolveStats = {
		distinct: number;
		defuser: number;
		defuserOnly: number;
		expert: number;
		efm: number;
		solo: number;
	};

	let stats: SolveStats = data.stats;
	let username: string = data.username;
	let shownUser: FrontendUser | null = data.shownUser;
	let completions: MissionCompletion[] = data.completions;
	let tpMissions: Mission[] = data.tpMissions;
	let unverifSolves: (Completion & { mission: Mission })[] | null = data.unverifSolves;
	let unverifMissions: Mission[] | null = data.unverifMissions;
	let unverifPacks: MissionPack[] | null = data.unverifPacks;
	let bestTimes: Mission[] = data.bestTimes;

	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
	let newUsername = username;
	const oldUsername = username;
	let tp = username === TP_TEAM;

	let dialog: HTMLDialogElement;

	const viewOptions = ['Alphabetical', 'By Role', 'Newest'];
	let viewMode = '';

	async function editName() {
		let response = await fetch('/user/rename', {
			method: 'POST',
			body: JSON.stringify({
				oldUsername,
				username: newUsername,
				nameExistsOK: false
			})
		});

		if (response.status == 202) {
			if (!confirm(`Merge this user with existing solver and mission author (${newUsername})?`)) return;
			response = await fetch('/user/rename', {
				method: 'POST',
				body: JSON.stringify({
					oldUsername,
					username: newUsername,
					nameExistsOK: true
				})
			});
		}

		if (response.ok) {
			location.href = `/user/${encodeURIComponent(newUsername)}`;
			return;
		}

		alert('Failed to edit name.');
	}

	let missions: { [name: string]: IndividualCompletion } = {};
	let missionsNames: { [name: string]: MissionCompletion[] } = {};
	// Sort completions
	completions.sort((a, b) => withoutArticle(a.mission.name).localeCompare(withoutArticle(b.mission.name)));
	let completionByNewest: MissionCompletion[] = Array(completions.length);
	Object.assign(completionByNewest, completions);
	completionByNewest.sort((a, b) =>
		a.dateAdded == null || b.dateAdded == null
			? a.dateAdded == null && b.dateAdded == null
				? a.mission.name.localeCompare(b.mission.name)
				: a.dateAdded == null
				? 1
				: -1
			: b.dateAdded.getTime() - a.dateAdded.getTime()
	);
	if (tp) {
		tpMissions.forEach(m => {
			let name = m.name;
			if (!(name in missions)) {
				missions[name] = new IndividualCompletion();
				missions[name].name = name;
				missions[name].efm = true;
				missions[name].nEFM = 1;
			}
		});
	} else {
		completions.forEach(c => {
			let name = c.mission.name;
			if (!(name in missions)) {
				missions[name] = new IndividualCompletion();
				missions[name].name = name;
			}
			if (tp) {
				missions[name].efm = true;
				missions[name].nEFM = 1;
			} else if (c.team.length === 1) {
				if (c.solo) {
					missions[name].solo = true;
					missions[name].nSolo += 1;
				} else {
					missions[name].efm = true;
					missions[name].nEFM += 1;
				}
			} else if (c.team.indexOf(username) == 0) {
				missions[name].defuser = true;
				missions[name].nDefuser += 1;
			} else {
				missions[name].expert = true;
				missions[name].nExpert += 1;
			}
		});
	}
	function filterUnique(item: MissionCompletion, pos: number, self: MissionCompletion[]): boolean {
		return self.findIndex(c => c.mission.name == item.mission.name) == pos;
	}

	function selectSolveCount(key: string, comp: IndividualCompletion): number {
		switch (key) {
			case 'Defuser':
				return comp.nDefuser;
			case 'Expert':
				return comp.nExpert;
			case 'EFM':
				return comp.nEFM;
			case 'Solo':
				return comp.nSolo;
			default:
				return 1;
		}
	}
	function selectDistinctSolveCount(key: string, stat: SolveStats): number {
		switch (key) {
			case 'Defuser':
				return stat.defuserOnly;
			case 'Expert':
				return stat.expert;
			case 'EFM':
				return stat.efm;
			case 'Solo':
				return stat.solo;
			default:
				return 0;
		}
	}

	missionsNames['Defuser + Expert + EFM'] = Object.entries(missions)
		.map(([name, c]) => (c.defuser && c.expert && c.efm ? completions.find(comp => comp.mission.name == name) : null))
		.flatMap(m => m ?? []);
	missionsNames['Solo'] = [];
	missionsNames['Defuser'] = [];
	missionsNames['Expert'] = [];
	missionsNames['EFM'] = [];
	if (tp) {
		tpMissions.forEach(m => {
			let c = new MissionCompletion();
			c.mission.name = m.name;
			c.team = [TP_TEAM];
			missionsNames['EFM'].push(c);
		});
	} else {
		completions.forEach(c => {
			if (c.team.length === 1) {
				if (c.solo) missionsNames['Solo'].push(c);
				else missionsNames['EFM'].push(c);
			} else {
				if (c.team.indexOf(username) == 0) missionsNames['Defuser'].push(c);
				else missionsNames['Expert'].push(c);
			}
		});
	}

	let wrView = writable(viewMode);
	let render = false;
	if (browser) {
		viewMode = JSON.parse(localStorage.getItem('user-solves-view') || JSON.stringify(viewOptions[0]));
		wrView.subscribe(value => {
			localStorage.setItem('user-solves-view', JSON.stringify(value));
		});
		storeView();
		render = true;
	}
	function storeView() {
		wrView.set(viewMode);
	}
</script>

<svelte:head>
	<title>{username}</title>
</svelte:head>

<h1 class="header">{username}</h1>
<div class="table">
	<b class="block" title="Number of distinct missions solved.">Distinct: {stats.distinct}</b>
	<b class="block" title="Number of missions solved (including duplicates)."
		>Total: {stats.defuser + stats.expert + stats.efm}</b>
	<b class="block" title="Including solos">Defuser: {stats.defuser}</b>
	<b class="block">Expert: {stats.expert}</b>
	<b class="block">EFM: {stats.efm}</b>
</div>

{#if unverifSolves !== null}
	<div class="block gray"><h4>Unverified Solves</h4></div>
	{#each unverifSolves as comp}
		<div class="unverif-item completion">
			<CompletionCard completion={comp} />
			<MissionCard mission={comp.mission} />
		</div>
	{/each}
{/if}
{#if unverifMissions !== null}
	<div class="block gray"><h4>Unverified Missions</h4></div>
	{#each unverifMissions as miss}
		<MissionCard mission={miss} selectable nolink />
	{/each}
{/if}
{#if unverifPacks !== null}
	<div class="block gray"><h4>Unverified Mission Packs</h4></div>
	{#each unverifPacks as pack}
		<div class="block flex">
			<a class="unverif-pack" href="https://steamcommunity.com/sharedfiles/filedetails/?id={pack.steamId}"
				>{pack.name}</a>
		</div>
	{/each}
{/if}

<div class="block"><h2>Solves</h2></div>
<div class="block legend-bar flex">
	<div class="legend flex">
		{#if tp}
			<span style="color:#fff; background-color: {getPersonColor(1, 0, false, true)}">TP</span>
		{:else}
			<span class="green" style="background-color: #00ff0044">Defuser + Expert + EFM</span>
			<span style="background-color: {getPersonColor(1, 0, true)}">Solo</span>
			<span style="background-color: {getPersonColor(2, 0, false)}">Defuser</span>
			<span style="background-color: {getPersonColor(2, 1, false)}">Expert</span>
			<span style="background-color: {getPersonColor(1, 0, false)}">EFM</span>
		{/if}
	</div>
	<Select id="view-select" label="View:" sideLabel options={viewOptions} bind:value={viewMode} on:change={storeView} />
</div>
{#if render && viewMode == viewOptions[2]}
	<div class="solves role flex grow">
		{#each completionByNewest as comp}
			<a href="/mission/{encodeURIComponent(comp.mission.name)}">
				<div
					class="block flex newest"
					class:tp-solve={tp}
					style:background-color={getPersonColor(comp.team.length, comp.team.indexOf(username), comp.solo, tp)}>
					<span class="mission-name">{comp.mission.name}</span>
					{#if comp.dateAdded}
						<span>{comp.dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{:else if render && viewMode == viewOptions[1]}
	{#each Object.entries(missionsNames) as [key, compList]}
		{#if compList.length > 0}
			{@const dist = selectDistinctSolveCount(key, stats)}
			<div class="block">
				<h4>
					<span>{key}: {pluralize(compList.length, 'solve')}</span>
					{#if !key.includes('+') && dist != compList.length}
						[{dist} distinct]
					{/if}
				</h4>
			</div>
			<div class="solves role flex grow">
				{#each compList.filter(filterUnique).sort((a, b) => a.mission.name.localeCompare(b.mission.name)) as comp}
					{@const solveCount = selectSolveCount(key, missions[comp.mission.name])}
					<a href="/mission/{encodeURIComponent(comp.mission.name)}" class:green={key.includes('+')}>
						<div
							class="block"
							class:tp-solve={tp}
							style:background-color={key.includes('+')
								? '#00ff0044'
								: getPersonColor(comp.team.length, comp.team.indexOf(username), comp.solo, tp)}>
							<span class="mission-name">{comp.mission.name}</span>
							{#if solveCount > 1}
								<b>×{solveCount}</b>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/each}
{:else if render}
	<div class="solves flex grow">
		{#each Object.values(missions).sort((a, b) => a.name.localeCompare(b.name)) as mission}
			<MissionCompletionCard {mission} {username} />
		{/each}
	</div>
{/if}
{#if hasPermission($page.data.user, Permission.RenameUser)}
	<div class="block flex column content-width">
		<button on:click={() => dialog.showModal()}>Edit Name</button>
		<Dialog bind:dialog>
			<div class="flex column content-width">
				<h2>Edit Name</h2>
				<form on:submit|preventDefault={() => editName()}>
					<Input
						id="username"
						label="Username"
						bind:value={newUsername}
						required
						validate={value => (value === oldUsername ? 'Please enter the new username.' : true)} />
					<button type="submit">Submit</button>
				</form>
			</div>
		</Dialog>
	</div>
{/if}
{#if shownUser !== null && hasPermission($page.data.user, Permission.ModifyPermissions)}
	<UserPermissions {shownUser} />
{/if}

<style>
	.table {
		display: grid;
		grid-template-columns: auto auto auto auto auto;
		gap: var(--gap);
		text-align: center;
	}

	h2,
	h4 {
		margin: 0;
	}
	.tp-solve {
		color: #fff;
	}

	.legend-bar {
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.legend {
		flex-wrap: wrap;
		width: 85%;
		justify-content: center;
	}
	.legend > span {
		padding: var(--gap);
		color: #000;
	}
	.legend .green {
		color: var(--text-color);
	}

	.solves > a {
		background-color: var(--foreground);
		color: var(--text-color);
	}
	.solves.role > a:not(.green) {
		color: #000;
	}
	.solves {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
		align-content: start;
		white-space: nowrap;
	}
	a:not(.unverif-pack) {
		text-decoration: none;
	}
	a.unverif-pack {
		color: var(--text-color);
	}
	a span.mission-name {
		text-decoration: underline;
	}
	a.green {
		background-color: var(--foreground);
	}
	.newest {
		justify-content: space-between;
		gap: 20px;
	}

	.unverif-item.completion {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gap);
	}
	.block.gray {
		background-color: var(--accent-gray);
	}
</style>
