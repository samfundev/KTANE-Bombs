<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import Select from '$lib/controls/Select.svelte';
	import { IndividualCompletion, Mission, MissionCompletion, Permission, type FrontendUser } from '$lib/types';
	import { getPersonColor, hasPermission, pluralize, properUrlEncode, withoutArticle } from '$lib/util';
	import UserPermissions from '../_UserPermissions.svelte';
	import { page } from '$app/stores';
	import MissionCompletionCard from '$lib/cards/MissionCompletionCard.svelte';
	import { TP_TEAM } from '$lib/const';
	import type { Completion, MissionPack } from '$lib/generated/prisma/client';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import SingleCompletionCard from '$lib/cards/SingleCompletionCard.svelte';
	import { onMount } from 'svelte';
	let { data } = $props();

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
	let shownUser: FrontendUser | null = $state(data.shownUser);
	let completions: MissionCompletion[] = data.completions;
	let currentSeasonName: string = data.currentSeasonName;
	let tpMissions: Mission[] = data.tpMissions;
	let unverifSolves: (Completion & { mission: Mission })[] | null = data.unverifSolves;
	let unverifMissions: Mission[] | null = data.unverifMissions;
	let unverifPacks: MissionPack[] | null = data.unverifPacks;
	let bestTimes: MissionCompletion[] = data.bestTimes;

	let newUsername = $state(username);
	const oldUsername = username;
	let tp = username === TP_TEAM;

	let dialog = $state() as HTMLDialogElement;

	const viewOptions = ['Alphabetical', 'By Role', 'Newest'];
	let viewMode = $state('');

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
			location.href = `/user/${properUrlEncode(newUsername)}`;
			return;
		}

		alert('Failed to edit name.');
	}

	let missions: { [name: string]: IndividualCompletion } = $state({});
	let missionsNames: { [name: string]: MissionCompletion[] } = $state({});
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

	let firstTimes = completions.filter(comp => comp.first);
	let displayAll = bestTimes.length > 0 || firstTimes.length > 0;

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

	let render = $state(false);
	let hideTopTimes = $state(true);
	let hideFirstSolves = $state(true);

	onMount(() => {
		viewMode = JSON.parse(localStorage.getItem('user-solves-view') || JSON.stringify(viewOptions[0]));
		hideTopTimes = JSON.parse(localStorage.getItem('user-solves-hide-top') || JSON.stringify(true));
		hideFirstSolves = JSON.parse(localStorage.getItem('user-solves-hide-first') || JSON.stringify(true));
		render = true;
	});

	$effect(() => {
		localStorage.setItem('user-solves-view', JSON.stringify(viewMode));
		localStorage.setItem('user-solves-hide-top', JSON.stringify(hideTopTimes));
		localStorage.setItem('user-solves-hide-first', JSON.stringify(hideFirstSolves));
	});
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
			<span>&nbsp;</span>
			<div class="flex season-legend">
				<div class="current" />
				<span>Season</span>
			</div>
			<div class="flex season-legend">
				<div class="past" />
				<span>Past&nbsp;Season</span>
			</div>
		{/if}
	</div>
	<Select id="view-select" label="View:" sideLabel options={viewOptions} bind:value={viewMode} />
</div>

{#if bestTimes.length > 0}
	<button class="reset block flex toggleable" onclick={() => (hideTopTimes = !hideTopTimes)}>
		<h4>Top Times ({bestTimes.length})</h4>
		<span class:hidden={!hideTopTimes}>(hidden)</span>
	</button>
	<div class="solves role flex grow" class:hidden={hideTopTimes}>
		{#each bestTimes.sort((a, b) => (a.time == undefined || b.time == undefined ? 0 : b.time - a.time)) as comp}
			<SingleCompletionCard {comp} {username} {currentSeasonName} showTime />
		{/each}
	</div>
{/if}

{#if firstTimes.length > 0}
	<button class="reset block flex toggleable" onclick={() => (hideFirstSolves = !hideFirstSolves)}>
		<h4>First Solves ({firstTimes.length})</h4>
		<span class:hidden={!hideFirstSolves}>(hidden)</span>
	</button>
	<div class="solves role flex grow" class:hidden={hideFirstSolves}>
		{#each firstTimes as comp}
			<SingleCompletionCard {comp} {username} {currentSeasonName} />
		{/each}
	</div>
{/if}

<!-- Newest -->
{#if render && viewMode == viewOptions[2]}
	<div class="block" class:hidden={!displayAll}><h4>All</h4></div>
	<div class="solves role flex grow">
		{#each completionByNewest as comp}
			<SingleCompletionCard {comp} {username} {currentSeasonName} />
		{/each}
	</div>
	<!-- By Role -->
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
					<a href="/mission/{properUrlEncode(comp.mission.name)}" class:green={key.includes('+')}>
						<div
							class="block flex multisolve"
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
	<!-- Alphabetical -->
{:else if render}
	<div class="block" class:hidden={!displayAll}><h4>All</h4></div>
	<div class="solves flex grow">
		{#each Object.values(missions).sort((a, b) => a.name.localeCompare(b.name)) as mission}
			<MissionCompletionCard {mission} {username} />
		{/each}
	</div>
{/if}
{#if hasPermission($page.data.user, Permission.RenameUser)}
	<div class="block flex column content-width">
		<button onclick={() => dialog.showModal()}>Edit Name</button>
		<Dialog bind:dialog>
			<div class="flex column content-width">
				<h2>Edit Name</h2>
				<form
					onsubmit={e => {
						e.preventDefault();
						editName();
					}}>
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
	<UserPermissions bind:shownUser />
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
	@media (prefers-color-scheme: dark) {
		.season-legend {
			background-color: #ddd;
			color: #000;
		}
	}
	.season-legend {
		border: 1px solid #888;
		align-items: center;
		font-weight: bold;
		padding: 0 3px;
	}
	.season-legend div {
		display: inline-block;
		width: 16px;
		height: 18px;
	}
	.season-legend .current {
		background: url('$lib/img/S-fancy.svg');
		background-repeat: no-repeat;
	}
	.season-legend .past {
		background: url('$lib/img/S-angular.svg');
		height: 16px;
		width: 18px;
		background-repeat: no-repeat;
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
	.multisolve {
		justify-content: space-between;
	}
	.toggleable {
		cursor: pointer;
		gap: 10px;
	}
	.toggleable > span {
		opacity: 60%;
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

	.unverif-item.completion {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gap);
	}
	.block.gray {
		background-color: var(--accent-gray);
	}
</style>
