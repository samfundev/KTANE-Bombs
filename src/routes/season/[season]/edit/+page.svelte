<script lang="ts">
	import Input from '$lib/controls/Input.svelte';

	import { formatDate, formatUTCDate, getSteamID, parseDate, parseUTCDate, validateSteamID } from '$lib/util';
	import equal from 'fast-deep-equal';
	import { applyAction } from '$app/forms';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import { Season } from '$lib/types';
	import TextArea from '$lib/controls/TextArea.svelte';

	export let data;

	let season: Season = data.season;
	let seasons: Pick<Season, 'name'>[] = data.seasons;

	let originalSeason: Season;

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

	$: modified = !equal(season, originalSeason);

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
		label="Start Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.start} />
	<Input
		type="datetime-local"
		classes="new-season-light"
		id="season-end"
		label="End Date (UTC time)"
		parse={parseUTCDate}
		display={formatUTCDate}
		required
		bind:value={season.end} />
	<TextArea
		classes="new-season-light"
		id="season-notes"
		label="Notes"
		autoExpand
		display={val => val ?? ''}
		bind:value={season.notes}
		parse={val => (val?.length > 0 ? val : null)} />

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

	.save-changes {
		pointer-events: auto;
		justify-content: center;
		align-items: center;
		box-shadow: var(--foreground) 0 0 10px;
		color: #ddd;
		background-color: rgb(15, 15, 15);
	}
</style>
