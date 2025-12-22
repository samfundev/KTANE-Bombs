<script lang="ts">
	import { type Completer, type ID, Permission, Season } from '$lib/types';
	import { properUrlEncode, hasPermission } from '$lib/util.js';
	import { page } from '$app/stores';
	import { applyAction } from '$app/forms';
	export let data;
	export let season: Season = data.season;
	let completers: Completer[] = data.seasonCompleters;
	let ranks: { [name: string]: number } = {};
	let rank = 1;
	let tied = 1;
	const dateOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	if (completers.length > 0) ranks[completers[0].name] = rank;
	for (let c = 1; c < completers.length; c++) {
		const comp = completers[c];
		const prev = completers[c - 1];
		if (
			comp.distinct === prev.distinct &&
			comp.defuser + comp.expert + comp.efm === prev.defuser + prev.expert + prev.efm
		) {
			tied++; // Tied with previous
		} else {
			rank += tied; // New rank
			tied = 1;
		}
		ranks[comp.name] = rank;
	}
</script>

<svelte:head>
	<title>{season.name}</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">{season.name}</h1>
	<div class="infobar flex">
		<span>
			<strong>Starts:</strong> {season.start.toLocaleTimeString(undefined, dateOptions)}
		</span>
		<span>
			<strong>Ends:</strong> {season.end.toLocaleTimeString(undefined, dateOptions)}
		</span>
	</div>
	{#if hasPermission($page.data.user, Permission.ManageSeasons)}
		<a href={$page.url.href + '/edit'} class="top-right">Edit</a>
	{/if}
</div>

{#if season.notes !== null}
	<div class="block">
		<b>Notes</b>:
		<span class="season-notes">{season.notes}</span>
	</div>
{/if}

<div class="table">
	<b class="block" />
	<b class="block">Name</b>
	<b class="block" title="Number of distinct missions solved.">Distinct</b>
	<b class="block" title="Number of missions solved (including duplicates).">Total</b>
	<b class="block">Defuser</b>
	<b class="block">Expert</b>
	<b class="block">EFM</b>
	{#each completers as completer}
		<div class="block">{ranks[completer.name]}</div>
		<div class="block"><a href="/user/{properUrlEncode(completer.name)}">{completer.name}</a></div>
		<div class="block">{completer.distinct}</div>
		<div class="block">{completer.defuser + completer.expert + completer.efm}</div>
		<div class="block">{completer.defuser}</div>
		<div class="block">{completer.expert}</div>
		<div class="block">{completer.efm}</div>
	{/each}
</div>

<style>
	.table {
		display: grid;
		grid-template-columns: min-content min-content auto auto auto auto auto;
		gap: var(--gap);
		text-align: center;
	}
	.header {
		position: relative;
	}

	.table b.block {
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.table .block {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.infobar {
		justify-content: center;
		gap: 25px;
	}

	.season-notes {
		white-space: pre-wrap;
	}

	a {
		color: var(--text-color);
	}

	.top-right {
		position: absolute;
		color: var(--text-color);
		top: var(--gap);
		right: var(--gap);
	}
</style>
