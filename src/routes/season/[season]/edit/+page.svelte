<script lang="ts">
	import Input from '$lib/controls/Input.svelte';

	import { formatUTCDate, parseUTCDate } from '$lib/util';
	import { applyAction } from '$app/forms';
	import { type ID, Mission, Season } from '$lib/types';
	import TextArea from '$lib/controls/TextArea.svelte';

	export let data;

	let season: Season = data.season;
	let seasons: Pick<Season, 'name'>[] = data.seasons;
	let missions: ID<Pick<Mission, 'name'>>[] = data.missions;
	const missionNames = [...missions].sort((a, b) => a.name.localeCompare(b.name));

	let originalSeason: Season;
	let missionToAdd: ID<Pick<Mission, 'name'>> | null = null;
	function uniqueSeasonName(value: string) {
		return seasons.some(s => s.name.toUpperCase() === value.toUpperCase() && value != originalSeason.name)
			? 'Name already exists.'
			: true;
	}

	function setOriginalSeason() {
		originalSeason = JSON.parse(JSON.stringify(season));
		originalSeason.start = season.start;
		originalSeason.end = season.end;
	}

	setOriginalSeason();

	let modified = false;
	let whitelist: string[] = [];
	$: {
		modified = JSON.stringify(season) !== JSON.stringify(originalSeason);
	}

	function removeMission() {
		if (missionToAdd?.id && season.whitelist.includes(missionToAdd.id)) {
			season.whitelist = season.whitelist.filter(id => id !== missionToAdd.id);
			season = season;
		}
		whitelist = missions.filter(m => season.whitelist.includes(m.id)).map(m => m.name);
	}

	function addMission() {
		if (missionToAdd?.id && !season.whitelist.includes(missionToAdd.id)) {
			season.whitelist.push(missionToAdd.id);
			season.whitelist.sort((a, b) => a - b);
			season = season;
		}
		whitelist = missions.filter(m => season.whitelist.includes(m.id)).map(m => m.name);
	}
	addMission();

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
	<Input id="season-name" label="Season Name" bind:value={season.name} required validate={uniqueSeasonName} />
	<Input
		type="datetime-local"
		classes="new-season-light"
		id="season-start"
		label="Season Start Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.start} />
	<Input
		type="datetime-local"
		classes="new-season-light"
		id="season-end"
		label="Season End Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.end} />
	<Input
		type="datetime-local"
		classes="new-season-light"
		id="season-missionsstart"
		label="Mission List Start Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.missionsStart} />
	<Input
		type="datetime-local"
		classes="new-season-light"
		id="season-missionsend"
		label="Mission List End Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.missionsEnd} />
	<TextArea
		classes="new-season-light"
		id="season-notes"
		label="Notes"
		autoExpand
		display={val => val ?? ''}
		bind:value={season.notes}
		parse={val => (val?.length > 0 ? val : null)} />
	<div class="hstack">
		<Input
			id="season-mission-to-add"
			label="Add/remove mission from whitelist"
			display={val => val?.name ?? ''}
			options={missionNames}
			bind:value={missionToAdd} />
		<button class="add" disabled={!missionToAdd} on:click={addMission}>Add</button>
		<button class="remove" disabled={!missionToAdd} on:click={removeMission}>Remove</button>
	</div>
	<strong class="whitelist-title">Mission Whitelist</strong>
	<ul>
		{#each whitelist as mission}
			<li>{mission}</li>
		{/each}
	</ul>

	<div class="actions">
		<button on:click={deleteSeason}>Delete</button>
	</div>
</div>
<div class="bottom-center flex" class:visible={modified}>
	<div class="save-changes block flex">
		There are unsaved changes.
		<button on:click={saveChanges}>Save</button>
	</div>
</div>

<style>
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
		transition: transform 0.4s, opacity 0.4s;
		transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
	}

	.bottom-center.visible {
		transform: none;
		opacity: 1;
	}

	.whitelist-title {
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

	:global(input#season-mission-to-add) {
		width: 500px;
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
