<script lang="ts">
	import { TP_TEAM } from '$lib/const';
	import type { Completer } from '$lib/types';
	import { properUrlEncode } from '$lib/util.js';
	export let data;
	let completers: Completer[] = data.completers;
	let ranks: { [name: string]: number } = {};
	let rank = 1;
	let tied = 1;

	if(completers.length > 0) ranks[completers[0].name] = rank;
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
	<title>Solvers</title>
</svelte:head>
<h1 class="header">
	Solvers
	<a href="/user/Twitch%20Plays">{TP_TEAM}</a>
</h1>
<div class="table">
	<b class="block"></b>
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
	.header a {
		position: absolute;
		font-size: 12pt;
		line-height: 2.2;
		color: #9146ff;
		left: 10px;
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

	a {
		color: var(--text-color);
	}
</style>
