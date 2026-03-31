<script lang="ts">
	import Input from '$lib/controls/Input.svelte';

	import { formatUTCDate, parseUTCDate, properUrlEncode } from '$lib/util';
	import { applyAction } from '$app/forms';
	import { type ID, Mission, Season } from '$lib/types';
	import TextArea from '$lib/controls/TextArea.svelte';
	import type { PageProps } from './$types';
	import type { SeasonWinners } from './_types';

	type VMission = {
		id: number;
		name: string;
		verified: boolean;
	};

	let { data }: PageProps = $props();

	let season: SeasonWinners = $state(data.season);
	let seasonNames: string[] = data.seasonNames;
	let names: string[] = data.names;
	let missions: VMission[] = data.missions;
	let defaultMissionList: VMission[] = data.missionList.filter(m => m.verified);
	let fullDefaultMissionList: VMission[] = data.missionList;
	const missionNames = [...missions].filter(m => m.verified);

	let originalSeason = $state() as Season;
	let winnerToAdd: string | null = $state(null);
	let inMissionToAdd: VMission | null = $state(null);
	let exMissionToAdd: VMission | null = $state(null);
	function uniqueSeasonName(value: string) {
		return value.length < 1
			? 'Name is required.'
			: seasonNames.includes(value.toUpperCase())
				? 'Name already exists.'
				: true;
	}

	function setOriginalSeason() {
		originalSeason = JSON.parse(JSON.stringify(season));
		originalSeason.start = season.start;
		originalSeason.end = season.end;
	}

	setOriginalSeason();

	let nameInvalid = $state(false);
	let modified = $derived(JSON.stringify(season) !== JSON.stringify(originalSeason) && !nameInvalid);
	let includeList: string[] = $state([]);
	let excludeList: string[] = $state([]);
	let missionList: VMission[] = $state(defaultMissionList);
	let winnersList: string[] = $state([]);

	function updateMissionList() {
		missionList = [
			...includeList.map(name => missions.find(m => m.name === name)).filter(m => m != undefined),
			...defaultMissionList.filter(m => !excludeList.includes(m.name))
		];
	}

	function updateIncludeList() {
		season.includeList = season.includeList.filter(id => missions.some(m => m.id === id));
		includeList = missions.filter(m => season.includeList.includes(m.id)).map(m => m.name);
		inMissionToAdd = null;
		updateMissionList();
	}
	function updateExcludeList() {
		season.excludeList = season.excludeList.filter(id => missions.some(m => m.id === id));
		excludeList = missions.filter(m => season.excludeList.includes(m.id)).map(m => m.name);
		exMissionToAdd = null;
		updateMissionList();
	}
	function updateWinnersList() {
		winnersList = season.winners;
		winnerToAdd = null;
	}

	function removeMissionFromIncludeList() {
		if (inMissionToAdd?.id && season.includeList.includes(inMissionToAdd.id)) {
			season.includeList = season.includeList.filter(id => id !== inMissionToAdd.id);
		}
		updateIncludeList();
	}

	function addMissionToIncludeList() {
		if (inMissionToAdd?.id && !season.includeList.includes(inMissionToAdd.id)) {
			season.includeList.push(inMissionToAdd.id);
			season.includeList.sort((a, b) => a - b);
		}
		updateIncludeList();
	}

	function removeMissionFromExcludeList() {
		if (exMissionToAdd?.id && season.excludeList.includes(exMissionToAdd.id)) {
			season.excludeList = season.excludeList.filter(id => id !== exMissionToAdd.id);
		}
		updateExcludeList();
	}

	function addMissionToExcludeList() {
		if (exMissionToAdd?.id && !season.excludeList.includes(exMissionToAdd.id)) {
			season.excludeList.push(exMissionToAdd.id);
			season.excludeList.sort((a, b) => a - b);
		}
		updateExcludeList();
	}

	function removeWinner() {
		if (winnerToAdd && season.winners.includes(winnerToAdd)) {
			season.winners = season.winners.filter(name => name !== winnerToAdd);
		}
		updateWinnersList();
	}

	function addWinner() {
		if (winnerToAdd && !season.winners.includes(winnerToAdd)) {
			season.winners.push(winnerToAdd);
			season.winners.sort((a, b) => a.localeCompare(b));
		}
		updateWinnersList();
	}

	addMissionToIncludeList();
	addMissionToExcludeList();
	addWinner();

	async function saveChanges() {
		const fData = new FormData();
		fData.append('season', JSON.stringify(season));

		const response = await fetch('?/editSeason', {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}

	async function deleteSeason() {
		if (!confirm('Delete Season. This cannot be undone. Are you sure?')) return;
		const fData = new FormData();
		fData.append('season', JSON.stringify(originalSeason));

		const response = await fetch('?/deleteSeason', {
			method: 'POST',
			body: fData
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}
</script>

<svelte:head>
	<title>{season.name}</title>
</svelte:head>
<div class="block flex column relative">
	<Input
		id="season-name"
		label="Season Name"
		bind:value={season.name}
		required
		validate={uniqueSeasonName}
		bind:invalid={nameInvalid} />
	<Input
		type="datetime-local"
		class="new-season-light"
		id="season-start"
		label="Season Start Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.start} />
	<Input
		type="datetime-local"
		class="new-season-light"
		id="season-end"
		label="Season End Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.end} />
	<Input
		type="datetime-local"
		class="new-season-light"
		id="season-missionsstart"
		label="Mission List Start Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.missionsStart} />
	<Input
		type="datetime-local"
		class="new-season-light"
		id="season-missionsend"
		label="Mission List End Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.missionsEnd} />
	<TextArea
		class="new-season-light"
		id="season-notes"
		label="Notes"
		autoExpand
		display={val => val ?? ''}
		bind:value={season.notes}
		parse={val => (val?.length > 0 ? val : null)} />
	<div class="hstack">
		<Input
			id="season-winner-to-add"
			label="Add/remove winner"
			display={val => val ?? ''}
			options={names}
			bind:value={winnerToAdd} />
		<button class="add" disabled={!winnerToAdd} onclick={addWinner}>Add</button>
		<button class="remove" disabled={!winnerToAdd} onclick={removeWinner}>Remove</button>
	</div>
</div>
{#if winnersList.length > 0}
	<div class="block title"><b>Winners</b> ({winnersList.length})</div>
	<div class="winners">
		{#each winnersList as winner}
			<a class="winner block" href="/user/{properUrlEncode(winner)}">{winner}</a>
		{/each}
	</div>
{/if}
<div class="block flex column relative">
	<div class="hstack">
		<Input
			id="season-mission-to-include"
			label="Add/remove mission from Include List"
			display={val => val?.name ?? ''}
			options={missionNames}
			bind:value={inMissionToAdd} />
		<button class="add" disabled={!inMissionToAdd} onclick={addMissionToIncludeList}>Add</button>
		<button class="remove" disabled={!inMissionToAdd} onclick={removeMissionFromIncludeList}>Remove</button>
	</div>
	<div class="hstack">
		<Input
			id="season-mission-to-exclude"
			label="Add/remove mission from Exclude List"
			display={val => val?.name ?? ''}
			options={fullDefaultMissionList}
			bind:value={exMissionToAdd} />
		<button class="add" disabled={!exMissionToAdd} onclick={addMissionToExcludeList}>Add</button>
		<button class="remove" disabled={!exMissionToAdd} onclick={removeMissionFromExcludeList}>Remove</button>
	</div>
	<strong class="includelist-title">Mission Include List</strong>
	<ul>
		{#each includeList as mission}
			<li>{mission}</li>
		{/each}
	</ul>
	<strong class="includelist-title">Mission Exclude List</strong>
	<ul>
		{#each excludeList as mission}
			<li>{mission}</li>
		{/each}
	</ul>

	<div class="actions">
		<button onclick={deleteSeason}>Delete</button>
	</div>
</div>
{#if missionList.length > 0}
	<div class="block title"><b>Allowed Missions</b> ({missionList.length})</div>
	<div class="missions">
		{#each missionList as mission}
			<a class="mission block" href="/mission/{properUrlEncode(mission.name)}">{mission.name}</a>
		{/each}
	</div>
{/if}
<div class="bottom-center flex" class:visible={modified}>
	<div class="save-changes block flex">
		There are unsaved changes.
		<button onclick={saveChanges}>Save</button>
	</div>
</div>

<style>
	.title.block {
		background-color: var(--block-separator);
		text-align: center;
	}
	:global(:is(input, textarea).new-season-light) {
		background-color: #eee;
		color: #000;
	}
	.bottom-center {
		position: fixed;
		bottom: var(--gap);
		justify-content: center;
		margin: var(--gap);
		width: calc((min(100vw, 1150px) - 4 * var(--gap)));

		transform: translateY(100%);
		pointer-events: none;
		opacity: 0;
		transition:
			transform 0.4s,
			opacity 0.4s;
		transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
	}

	.bottom-center.visible {
		transform: none;
		opacity: 1;
	}

	.includelist-title {
		margin-top: 10px;
	}
	ul {
		margin-top: 0;
	}

	.hstack {
		gap: 10px;
		display: flex;
		align-items: end;
	}
	.hstack button {
		height: 1.8em;
	}

	:global(input#season-mission-to-include, input#season-mission-to-exclude) {
		width: 500px;
	}
	:global(input#season-winner-to-add) {
		width: 300px;
	}

	.missions, .winners {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
		align-content: start;
	}
	.mission, .winner {
		padding: var(--gap) 8px;
		flex-grow: 1;
	}
	.winner {
		color: var(--winner-color);
	}

	.save-changes {
		pointer-events: auto;
		justify-content: center;
		align-items: center;
		box-shadow: var(--foreground) 0 0 10px;
		color: #ddd;
		background-color: rgb(15, 15, 15);
	}
</style>
