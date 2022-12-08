<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import Select from '$lib/controls/Select.svelte';
	import { Completion, IndividualCompletion, Mission, Permission, type FrontendUser } from '$lib/types';
	import { getPersonColor, hasPermission, onlyUnique, pluralize, withoutArticle } from '$lib/util';
	import UserPermissions from '../_UserPermissions.svelte';
	import { page } from '$app/stores';
	import MissionCompletionCard from '$lib/cards/MissionCompletionCard.svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	export let data;

	type SolveStats = {
		distinct: number;
		defuser: number;
		defuserOnly: number;
		expert: number;
		efm: number;
		solo: number;
	};
	type MissionCompletion = Pick<Completion, 'team' | 'solo'> & { mission: { name: string } };
	let stats: SolveStats = data.stats;
	let username: string = data.username;
	let shownUser: FrontendUser | null = data.shownUser;
	let completions: MissionCompletion[] = data.completions;

	let newUsername = username;
	const oldUsername = username;

	let dialog: HTMLDialogElement;

	const viewOptions = ['Alphabetical', 'By Role'];
	let byRole = '';

	async function editName() {
		const response = await fetch('/user/rename', {
			method: 'POST',
			body: JSON.stringify({
				oldUsername,
				username: newUsername,
				userExists: shownUser !== null
			})
		});

		if (response.ok) {
			location.href = `/user/${newUsername}`;
			return;
		}

		alert('Failed to edit name.');
	}

	let missions: { [name: string]: IndividualCompletion } = {};
	let missionsNames: { [name: string]: MissionCompletion[] } = {};
	// Sort completions
	completions.sort((a, b) => withoutArticle(a.mission.name).localeCompare(withoutArticle(b.mission.name)));
	completions.forEach(c => {
		let name = c.mission.name;
		if (!(name in missions)) {
			missions[name] = new IndividualCompletion();
			missions[name].name = name;
		}
		if (c.team.length === 1) {
			if (c.solo) {
				missions[name].solo = true;
				missions[name].nSolo += 1;
			} else {
				missions[name].efm = true;
				missions[name].nEFM += 1;
			}
		} else {
			if (c.team.indexOf(username) == 0) {
				missions[name].defuser = true;
				missions[name].nDefuser += 1;
			} else {
				missions[name].expert = true;
				missions[name].nExpert += 1;
			}
		}
	});
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
	completions.forEach(c => {
		if (c.team.length === 1) {
			if (c.solo) missionsNames['Solo'].push(c);
			else missionsNames['EFM'].push(c);
		} else {
			if (c.team.indexOf(username) == 0) missionsNames['Defuser'].push(c);
			else missionsNames['Expert'].push(c);
		}
	});

	let wrView = writable(byRole);
	if (browser) {
		byRole = JSON.parse(localStorage.getItem('user-solves-view') || JSON.stringify(viewOptions[0]));
		wrView.subscribe(value => {
			localStorage.setItem('user-solves-view', JSON.stringify(value));
		});
		storeView();
	}
	function storeView() {
		wrView.set(byRole);
	}

	// missionsNames['Defuser'] = missionsNames['Defuser'].filter(filterUnique);
	// missionsNames['Expert'] = missionsNames['Expert'].filter(filterUnique);
	// missionsNames['EFM'] = missionsNames['EFM'].filter(filterUnique);
	// missionsNames['Solo'] = missionsNames['Solo'].filter(filterUnique);
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
<div class="block legend flex">
	<span class="green" style="background-color: #00ff0044">Defuser + Expert + EFM</span>
	<span style="background-color: {getPersonColor(1, 0, true)}">Solo</span>
	<span style="background-color: {getPersonColor(2, 0, false)}">Defuser</span>
	<span style="background-color: {getPersonColor(2, 1, false)}">Expert</span>
	<span style="background-color: {getPersonColor(1, 0, false)}">EFM</span>
	<div class="right-side">
		<Select id="view-select" label="View:" sideLabel options={viewOptions} bind:value={byRole} on:change={storeView} />
	</div>
</div>
<div class="block"><h2>Solves</h2></div>
{#if byRole == viewOptions[1]}
	{#each Object.entries(missionsNames) as [key, compList]}
		{#if compList.length > 0}
			{@const dist = selectDistinctSolveCount(key, stats)}
			<div class="block">
				<h4>
					<span>{key}: {pluralize(compList.length, 'solve')}</span>
					<span class:hidden={key.includes('+') || dist == compList.length}>[{dist} distinct]</span>
				</h4>
			</div>
			<div class="solves role flex grow">
				{#each compList.filter(filterUnique) as comp}
					{@const solveCount = selectSolveCount(key, missions[comp.mission.name])}
					<a href="/mission/{encodeURIComponent(comp.mission.name)}" class:green={key.includes('+')}>
						<div
							class="block"
							style:background-color={key.includes('+')
								? '#00ff0044'
								: getPersonColor(comp.team.length, comp.team.indexOf(username), comp.solo)}>
							<span class="mission-name">{comp.mission.name}</span>
							<span class:hidden={solveCount < 2}>×{solveCount}</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/each}
{:else}
	<div class="solves flex grow">
		{#each Object.values(missions) as mission}
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
{#if shownUser !== null && $page.data.user !== null && hasPermission($page.data.user, Permission.ModifyPermissions)}
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

	.legend {
		justify-content: center;
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.legend > span {
		padding: var(--gap);
		color: #000;
	}
	.legend .green {
		color: var(--text-color);
	}
	.right-side {
		position: absolute;
		right: var(--gap);
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
	a {
		text-decoration: none;
	}
	a span.mission-name {
		text-decoration: underline;
	}
	a.green {
		background-color: var(--foreground);
	}
	a span.hidden,
	h4 span.hidden {
		display: none;
	}
</style>
