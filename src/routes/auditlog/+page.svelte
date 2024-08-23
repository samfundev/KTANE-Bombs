<script lang="ts">
	import { UNKNOWN_ITEM } from '$lib/const.js';
	import { isOnlyDigits, onlyUnique, properUrlEncode } from '$lib/util.js';
	import { AuditLog, Prisma } from '@prisma/client';

	const dateOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	export let data;
	let logs: (AuditLog & { linkable: boolean; mission: string | null })[] = data.logs;

	function pastTense(log: AuditLog): string {
		if (
			(log.model === 'Mission' || log.model === 'MissionPack' || log.model === 'Completion') &&
			(log.action === 'delete' || log.action === 'update')
		) {
			const statsBef = JSON.parse(JSON.stringify(log.before));
			const statsAft = JSON.parse(JSON.stringify(log.after));
			if (log.action === 'delete' && statsBef.verified === false) return 'rejected';
			else if (log.action === 'update' && statsBef.verified === false && statsAft.verified === true) return 'accepted';
		}
		return log.action + (log.action.endsWith('e') ? 'd' : 'ed');
	}
	function shortName(str: string): string {
		if (str.length > 24) return str.substring(0, 22) + ' ...';
		else return str;
	}
	function unlinkable(str: string): string {
		if (str === UNKNOWN_ITEM) return 'Unknown';
		return shortName(str);
	}
	function shortTeam(str: string): string {
		if (str.length > 23) return str.substring(0, 21) + '...';
		else return str;
	}
	function shortItem(str: string): string {
		if (str.length > 13) return str.substring(0, 11) + '...';
		else return str;
	}

	type ItemDetails = { item: string; before: string; after: string };
	const CELL_LIM = 100;
	function smallItem(item: ItemDetails[]) {
		return item.length < 4 && item.every(itm => itm.before.length < CELL_LIM && itm.after.length < CELL_LIM);
	}
	function displayLog(before: Prisma.JsonValue, after: Prisma.JsonValue) {
		let beforeStr = JSON.stringify(before); //before, undefined, 1);
		let beforeStats = JSON.parse(beforeStr);
		let beforeKeys = Object.keys(beforeStats ?? {});
		let afterStr = JSON.stringify(after);
		let afterStats = JSON.parse(afterStr);
		let afterKeys = Object.keys(afterStats ?? {});
		let keys = [...beforeKeys, ...afterKeys].filter(onlyUnique);
		keys.sort();
		let table = [];
		for (const key in keys) {
			let row: ItemDetails = { item: keys[key], before: '', after: '' };
			if (beforeStats != null && keys[key] in beforeStats) row.before = JSON.stringify(beforeStats[keys[key]]);
			if (afterStats != null && keys[key] in afterStats) row.after = JSON.stringify(afterStats[keys[key]]);
			table.push(row);
		}

		// if (stats == null || stats == undefined || Object.keys(stats).length == 0) return { short: '', full: '' };
		return {
			short: table.slice(0, 3).map(row => ({
				item: row.item,
				before: row.before.substring(0, CELL_LIM),
				after: row.after.substring(0, CELL_LIM)
			})),
			full: table
		};
	}

	function reveal(index: number) {
		let elem = document.querySelector(`.dropdown.d${index}`);
		elem?.classList.add('expand');
	}
	function hide(index: number) {
		let elem = document.querySelector(`.dropdown.d${index}`);
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
	<div class="block table-headers">
		<b>Item</b>
		<b>Before</b>
		<b>After</b>
	</div>
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
				{#if log.linkable}
					<a href="/mission/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
				{:else}
					{unlinkable(log.name)}
				{/if}
			{:else if log.model === 'MissionPack'}
				{#if log.linkable}
					<a href="/missionpack/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
				{:else}
					{unlinkable(log.name)}
				{/if}
			{:else if log.model === 'Completion'}
				<span title={log.name}>{shortTeam(log.name)}</span> on <br />
				{#if log.linkable && log.mission != null}
					<a href="/mission/{properUrlEncode(log.mission)}">{shortName(log.mission)}</a>
				{:else}
					{unlinkable(log.name)}
				{/if}
			{:else if log.model === 'User'}
				{#if log.linkable}
					<a href="/user/{properUrlEncode(log.name)}">{shortName(log.name)}</a>
				{:else}
					{unlinkable(log.name)}
				{/if}
			{/if}
			<br />
			{log.timestamp.toLocaleDateString(undefined, dateOptions)}
		</div>
		{@const display = displayLog(log.before, log.after)}
		<div class="block dropdown d{index}" class:small={smallItem(display.full)} class:expand={smallItem(display.full)}>
			<div class="short" on:click={() => reveal(index)}>
				<div class="log-details">
					{#each display.short as row}
						<div title={row.item}>{shortItem(row.item)}</div>
						<div>{row.before}</div>
						<div>{row.after}</div>
					{/each}
				</div>
				<strong>...</strong>
			</div>
			<div class="full">
				<div class="contract" on:click={() => hide(index)} />
				<div class="log-details">
					{#each display.full as row}
						<div title={row.item}>{shortItem(row.item)}</div>
						<div>{row.before}</div>
						<div>{row.after}</div>
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	:root {
		--cell-width: calc((var(--page-content-width) - 240px) / 2 - var(--gap) - 120px);
	}
	.number {
		font-size: 10px;
		padding: 1px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.table-headers,
	.log-details {
		display: grid;
		grid-template-columns: 120px var(--cell-width) var(--cell-width);
	}
	.table-headers b {
		text-align: left;
	}
	.table {
		display: grid;
		grid-template-columns: 30px 210px auto;
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
	.dropdown div.full {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.dropdown.small .contract {
		display: none;
	}
	.dropdown .log-details div {
		text-align: left;
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
