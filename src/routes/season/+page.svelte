<script lang="ts">
	import { Permission } from '$lib/types';
	import { formatUTCDate, hasPermission, parseUTCDate } from '$lib/util.js';
	import { page } from '$app/stores';
	import { Season } from '@prisma/client';
	import toast from 'svelte-french-toast';
	import Input from '$lib/controls/Input.svelte';
	import Dialog from '$lib/controls/Dialog.svelte';

	export let data;
	export let seasons: Season[] = data.seasons || [];

	let dialog: HTMLDialogElement;
	let seasonName: string = '';
	let [seasonStart, seasonEnd] = getNextQuarterRange();
	// console.log(seasonStart.toISOString());
	// console.log(seasonEnd.toISOString());

	function uniqueSeasonName(value: string) {
		return seasons.some(s => s.name.toUpperCase() === value.toUpperCase()) ? 'Name already exists.' : true;
	}

	function getNextQuarterRange(fromDate: Date = new Date()): [Date, Date] {
		let from = new Date(fromDate);
		from.setUTCDate(from.getUTCDate() - 1);
		const year = from.getUTCFullYear();

		const quarterStarts = [
			new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)), // Jan 1
			new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0)), // Apr 1
			new Date(Date.UTC(year, 6, 1, 0, 0, 0, 0)), // Jul 1
			new Date(Date.UTC(year, 9, 1, 0, 0, 0, 0)) // Oct 1
		];

		let start: Date | undefined;

		for (const candidate of quarterStarts) {
			if (candidate.getTime() > from.getTime()) {
				start = candidate;
				break;
			}
		}

		// If none remain this year, use Jan 1 of next year
		if (!start) {
			start = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
		}

		// End = start + 3 months, minus 1 minute
		const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1, 0, 0, 0, 0));
		end.setUTCMinutes(end.getUTCMinutes() - 1);

		return [start, end];
	}

	async function addSeason() {
		if (!seasonName.trim()) return;

		try {
			const response = await fetch('/season/new', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					seasonName: seasonName.trim(),
					start: seasonStart,
					end: seasonEnd
				})
			});

			if (response.ok) {
				toast.success(`Season "${seasonName.trim()}" added successfully!`);
				dialog.close();
			}

			seasonName = '';
		} catch (error) {
			console.error('Error adding season:', error);
		}
	}
</script>

<svelte:head>
	<title>Seasons</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">Seasons</h1>
	<a href="/seasoninfo" class="top-left">Info</a>

	{#if hasPermission($page.data.user, Permission.ManageSeasons)}
		<div class="actions">
			<button on:click={() => dialog.showModal()}>Create New Season</button>
		</div>
	{/if}
</div>

{#if hasPermission($page.data.user, Permission.ManageSeasons)}
	<Dialog bind:dialog>
		<div class="flex column content-width">
			<h2>Create New Season</h2>
			<form on:submit|preventDefault={() => addSeason()}>
				<Input
					classes="new-season"
					id="season-name"
					label="Season Name"
					bind:value={seasonName}
					required
					placeholder="Cool Name"
					validate={uniqueSeasonName} />
				<Input
					type="datetime-local"
					classes="new-season"
					id="season-start"
					label="Start Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={seasonStart} />
				<Input
					type="datetime-local"
					classes="new-season"
					id="season-end"
					label="End Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={seasonEnd} />
				<button type="submit">Submit</button>
			</form>
		</div>
	</Dialog>
{/if}

{#each seasons as season, index}
	<div class="block">
		<div class="flex">
			<h3>{index + 1}</h3>
			<a href="/season/{season.name}"><h3>{season.name}</h3></a>
		</div>
	</div>
{/each}

<style>
	:global(input.new-season) {
		background-color: #eee;
		color: #000;
	}
	.flex {
		gap: 15px;
	}

	a {
		color: var(--text-color);
	}
	.top-left {
		position: absolute;
		color: var(--text-color);
		top: var(--gap);
		left: var(--gap);
	}
</style>
