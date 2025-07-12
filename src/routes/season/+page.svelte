<script lang="ts">
	import { Permission } from '$lib/types';
	import { currSeason, formatUTCDate, hasPermission, parseUTCDate, pastSeason } from '$lib/util.js';
	import { page } from '$app/state';
	import type { Season } from '@prisma/client';
	import toast from 'svelte-french-toast';
	import Input from '$lib/controls/Input.svelte';
	import Dialog from '$lib/controls/Dialog.svelte';

	let { data } = $props();
	let { seasons, currentSeasonName } = data;

	let dialog: HTMLDialogElement | undefined = $state();
	let seasonName: string = $state('');
	let [seasonStart, seasonEnd, missionsStart, missionsEnd] = $state(getNextQuarterRange());

	function uniqueSeasonName(value: string) {
		return seasons.some(s => s.name.toUpperCase() === value.toUpperCase()) ? 'Name already exists.' : true;
	}

	function getNextQuarterRange(fromDate: Date = new Date()): [Date, Date, Date, Date] {
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
		const missionsStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 3, 1, 0, 0, 0, 0));
		const missionsEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1, 0, 0, 0, 0));
		missionsEnd.setUTCMinutes(missionsEnd.getUTCMinutes() - 1);

		return [start, end, missionsStart, missionsEnd];
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
					end: seasonEnd,
					missionsStart: missionsStart,
					missionsEnd: missionsEnd
				})
			});

			if (response.ok) {
				toast.success(`Season "${seasonName.trim()}" added successfully!`);
				dialog?.close();
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

	{#if hasPermission(page.data.user, Permission.ManageSeasons)}
		<div class="actions">
			<button onclick={() => dialog?.showModal()}>Create New Season</button>
		</div>
	{/if}
</div>

{#if hasPermission(page.data.user, Permission.ManageSeasons)}
	<Dialog bind:dialog>
		<div class="flex column content-width">
			<h2>Create New Season</h2>
			<form
				onsubmit={e => {
					e.preventDefault();
					addSeason();
				}}>
				<Input
					class="new-season"
					id="season-name"
					label="Season Name"
					bind:value={seasonName}
					required
					placeholder="Cool Name"
					validate={uniqueSeasonName} />
				<Input
					type="datetime-local"
					class="new-season"
					id="season-start"
					label="Start Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={seasonStart} />
				<Input
					type="datetime-local"
					class="new-season"
					id="season-end"
					label="End Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={seasonEnd} />
				<Input
					type="datetime-local"
					classes="new-season"
					id="season-missions-start"
					label="Mission List Start Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={missionsStart} />
				<Input
					type="datetime-local"
					classes="new-season"
					id="season-missions-end"
					label="Mission List End Date (UTC time)"
					parse={parseUTCDate}
					display={formatUTCDate}
					required
					bind:value={missionsEnd} />
				<button type="submit">Submit</button>
			</form>
		</div>
	</Dialog>
{/if}

{#each seasons as season, index}
	<a class="plain" href="/season/{season.name}">
		<div class="block">
			<div class="flex season-box">
				<div class="flex">
					<h3 class="plain">{seasons.length - index}</h3>
					<h3>{season.name}</h3>
				</div>
				<div
					class="season-legend"
					class:past={pastSeason(season, currentSeasonName)}
					class:current={currSeason(season, currentSeasonName)}>
				</div>
			</div>
		</div>
	</a>
{/each}

<style>
	:global(input.new-season) {
		background-color: #eee;
		color: #000;
	}
	h3 {
		font-size: 24px;
		text-decoration: underline;
		margin: 12px 0;
	}
	a.plain,
	h3.plain {
		text-decoration: none;
	}
	.flex {
		gap: 15px;
	}
	.flex.season-box {
		align-items: center;
		justify-content: space-between;
	}

	.season-legend {
		display: inline-block;
		width: 32px;
		height: 35px;
	}
	@media (prefers-color-scheme: dark) {
		.season-legend {
			filter: invert(1);
		}
	}
	.season-legend.current {
		background: url('$lib/img/S-fancy.svg');
		background-repeat: no-repeat;
	}
	.season-legend.past {
		background: url('$lib/img/S-angular.svg');
		height: 18px;
		width: 20px;
		background-repeat: no-repeat;
		margin-right: 8px;
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
