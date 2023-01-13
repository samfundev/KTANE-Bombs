<script lang="ts">
	import type { Completer } from '$lib/types';
	export let data;
	let completers: Completer[] = data.completers;
</script>

<svelte:head>
	<title>Solvers</title>
</svelte:head>
<h1 class="header">
	Solvers
	<a href="/user/Twitch%20Plays">Twitch Plays</a>
</h1>
<div class="table">
	<b class="block" />
	<b class="block">Name</b>
	<b class="block" title="Number of distinct missions solved.">Distinct</b>
	<b class="block" title="Number of missions solved (including duplicates).">Total</b>
	<b class="block">Defuser</b>
	<b class="block">Expert</b>
	<b class="block">EFM</b>
	{#each completers as completer, index}
		<div class="block">{index + 1}</div>
		<div class="block"><a href="/user/{encodeURIComponent(completer.name)}">{completer.name}</a></div>
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

	a {
		color: var(--text-color);
	}
</style>
