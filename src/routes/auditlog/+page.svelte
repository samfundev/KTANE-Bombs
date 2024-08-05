<script lang="ts">
	import { isOnlyDigits, properUrlEncode } from '$lib/util.js';
	import { AuditLog, Prisma } from '@prisma/client';

	const dateOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	export let data;
	let logs: AuditLog[] = data.logs;

	function pastTense(log: AuditLog): string {
		if (log.model === 'Mission' && (log.action === 'delete' || log.action === 'update')) {
			const missonStatsBef = JSON.parse(JSON.stringify(log.before));
			const missonStatsAft = JSON.parse(JSON.stringify(log.after));
			if (log.action === 'delete' && missonStatsBef.verified === false) return 'rejected';
			else if (log.action === 'update' && missonStatsBef.verified === false && missonStatsAft.verified === true)
				return 'accepted';
		}
		return log.action + (log.action.endsWith('e') ? 'd' : 'ed');
	}
	function shortName(str: string): string {
		if (str.length > 24) return str.substring(0, 24) + ' ...';
		else return str;
	}
	function displayLog(js: Prisma.JsonValue) {
		const str = JSON.stringify(js, undefined, 1);
		const stats = JSON.parse(str);
		if (stats == null || stats == undefined || Object.keys(stats).length == 0) return { short: '', full: '' };
		return { short: str.substring(0, 250), full: str };
	}

	function reveal(before: boolean, index: number) {
		let elem = document.querySelector(`.dropdown.${before ? 'before' : 'after'}${index}`);
		elem?.classList.add('expand');
	}
	function hide(before: boolean, index: number) {
		let elem = document.querySelector(`.dropdown.${before ? 'before' : 'after'}${index}`);
		elem?.classList.remove('expand');
	}
	function closeAll() {
		document.querySelectorAll('.dropdown:not(.small)').forEach(el => {
			el.classList.remove('expand');
		});
	}
</script>

<svelte:head>
	<title>Audit Log</title>
</svelte:head>
<h1 class="header">Audit Log</h1>
<div class="block">
	<button on:click={closeAll}>Close All</button>
</div>

<div class="table">
	<div class="block" />
	<b class="block">Description</b>
	<b class="block">Before</b>
	<b class="block">After</b>
	{#each logs as log, index}
		<div class="block number">{index + 1}</div>
		<div class="block">
			{#if log.userId != null && !isOnlyDigits(log.userId)}
				<a href="/user/{properUrlEncode(log.userId)}">{log.userId}</a>
			{:else}
				{log.userId}
			{/if}
			<br />
			{pastTense(log)}
			{log.model.toLowerCase()} <br />
			{#if log.model === 'Mission'}
				<a href="/mission/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
			{:else if log.model === 'Missionpack'}
				<a href="/missionpack/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
			{:else if log.model === 'Completion'}
				{@const names = log.name.split('||')}
				{names[1]} on <br />
				<a href="/mission/{properUrlEncode(names[0])}">{shortName(names[0])}</a>
			{:else if log.model === 'User'}
				<a href="/user/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
			{/if}
			<br />
			{log.timestamp.toLocaleDateString(undefined, dateOptions)}
		</div>
		{@const before = displayLog(log.before)}
		<div
			class="block dropdown before{index}"
			class:small={before.full.length < 250}
			class:expand={before.full.length < 250}>
			<div class="short" on:click={() => reveal(true, index)}>
				{before.short} <strong>...</strong>
			</div>
			<div class="full">
				<div class="contract" on:click={() => hide(true, index)} />
				{before.full}
			</div>
		</div>
		{@const after = displayLog(log.after)}
		<div
			class="block dropdown after{index}"
			class:small={after.full.length < 250}
			class:expand={after.full.length < 250}>
			<div class="short" on:click={() => reveal(false, index)}>
				{after.short} <strong>...</strong>
			</div>
			<div class="full">
				<div class="contract" on:click={() => hide(false, index)} />
				{after.full}
			</div>
		</div>
	{/each}
</div>

<style>
	:root {
		--cell-width: calc((var(--page-content-width) - 240px) / 2 - var(--gap));
	}
	.number {
		font-size: 10px;
		padding: 1px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.table {
		display: grid;
		grid-template-columns: 30px 210px var(--cell-width) var(--cell-width);
		gap: var(--gap);
		text-align: center;
		width: 100%;
		overflow: hidden;
	}
	.table > div {
		overflow-wrap: break-word;
	}
	.dropdown:not(.expand) {
		cursor: pointer;
	}
	.dropdown:not(.expand) div.full,
	.dropdown.expand div.short {
		display: none;
	}
	.dropdown.small .contract {
		display: none;
	}
	.contract {
		background: url('$lib/img/clear-button.svg') right center no-repeat;
		width: 1.25em;
		height: 1.25em;
		min-width: 1.25em;
		display: inline-block;
		vertical-align: middle;
		cursor: pointer;
	}
</style>
