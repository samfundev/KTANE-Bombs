<script lang="ts">
	import LayoutSearchFilter from '$lib/comp/LayoutSearchFilter.svelte';
	import { UNKNOWN_ITEM } from '$lib/const.js';
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import {
		evaluateLogicalStringSearch,
		isOnlyDigits,
		logicalSearchTooltip,
		onlyUnique,
		properUrlEncode,
		titleCase
	} from '$lib/util.js';
	import { type AuditLog, Prisma } from '@prisma/client';
	import { onMount } from 'svelte';

	const dateOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	let { data } = $props();
	let logs: (AuditLog & { linkable: boolean; mission: string | null })[] = data.logs;

	let logRows: any = $state({});
	let resultsText: number = $state(logs.length);
	let searchOptionBoxes = ['from user', 'mission', 'mission pack', 'solve', 'user', 'invert'];
	let searchOptionTooltips = [
		'Search for the user that made the change',
		'Search for mission name',
		'Search for mission pack name',
		'Search for solve team or mission name for a solve',
		'Search for edited users',
		'Invert search'
	];
	let layoutSearch: LayoutSearchFilter = $state();
	let searchOptions: string[] = [];
	let showAll = $state(false);
	const resultLimit = 50;
	let validSearchOptions: boolean[] = $state(Array(searchOptionBoxes.length).fill(false));
	validSearchOptions[1] = validSearchOptions[2] = validSearchOptions[3] = true;

	function pastTense(log: AuditLog): string {
		if (
			(log.model === 'Mission' || log.model === 'MissionPack' || log.model === 'Completion') &&
			(log.action === 'delete' || log.action === 'update')
		) {
			const statsBef = JSON.parse(JSON.stringify(log.before));
			const statsAft = JSON.parse(JSON.stringify(log.after));
			if (
				log.action === 'delete' &&
				statsBef.verified === false &&
				!(log.model === 'Mission' && log.name.includes('[[UPDATE]]'))
			) {
				return 'rejected';
			} else if (log.action === 'update' && statsBef.verified === false && statsAft.verified === true)
				return 'accepted';
		}
		return log.action + (log.action.endsWith('e') ? 'd' : 'ed');
	}
	function unlinkable(str: string): string {
		return str === UNKNOWN_ITEM ? 'Unknown' : str;
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

	function logSearchFilter(name: string, searchText: string): boolean {
		let text = searchText.toLowerCase();
		let searchWhat: string[] = [];
		let log = logs[parseInt(name)];
		let model = log.model.toLocaleLowerCase();

		if (
			(searchOptions?.includes('mission') && model === 'mission') ||
			(searchOptions?.includes('mission pack') && model === 'missionpack') ||
			(searchOptions?.includes('user') && model === 'user')
		) {
			searchWhat.push(log.name.toLowerCase());
		}
		if (searchOptions?.includes('solve') && model === 'completion') {
			searchWhat.push(log.name.toLowerCase());
			if (log.mission) searchWhat.push(log.mission.toLowerCase());
		}
		if (searchOptions?.includes('from user')) {
			if (log.userId) searchWhat.push(log.userId.toLowerCase());
		}

		let textMatch = evaluateLogicalStringSearch(text, searchWhat);

		let optionMatch =
			searchOptions.includes('from user') ||
			searchOptions.includes(model) ||
			(searchOptions.includes('solve') && model == 'completion') ||
			(searchOptions.includes('mission pack') && model == 'missionpack');

		return searchOptions.includes('invert') != (optionMatch && textMatch);
	}
	function setSearchOptions() {
		let options = searchOptionBoxes.filter((_, idx) => {
			return validSearchOptions[idx];
		});
		searchOptions = options;
		searchOptionBoxes.forEach((o, i) => {
			validSearchOptions[i] = options.includes(o);
		});
		layoutSearch.updateSearch();
	}
	onMount(() => {
		setSearchOptions();
	});
</script>

<svelte:head>
	<title>Audit Log</title>
</svelte:head>
<h1 class="header">Audit Log</h1>

<div class="top-bar block">
	<div class="hstack">
		<span>Max {resultLimit} results shown</span>
		<Checkbox
			id="show-all-check"
			onchange={() => {
				layoutSearch.updateSearch();
			}}
			bind:checked={showAll}
			label="Show All"
			sideLabel
			labelAfter />
	</div>
	<div class="flex row search-bar">
		<span>Results: {resultsText} of {logs.length}</span>
		<LayoutSearchFilter
			id="log-search-field"
			label="Search:"
			rows={1}
			textArea
			autoExpand
			title={logicalSearchTooltip}
			bind:items={logRows}
			bind:numResults={resultsText}
			bind:this={layoutSearch}
			filterFunc={logSearchFilter}
			bind:showAll
			{resultLimit}
			class="help" />
		<button onclick={closeAll}>Close All</button>
		{#each searchOptionBoxes as option, index}
			<Checkbox
				id="search-by-{option.replace(/ /g, '')}"
				label={titleCase(option)}
				sideLabel
				labelAfter
				title={searchOptionTooltips[index]}
				onchange={setSearchOptions}
				bind:checked={validSearchOptions[index]} />
		{/each}
		<!-- <span class="sort-option alphabetical" class:selected={sortOption == 'alphabetical'} onclick={alphabetical}
		>Alphabetical</span>
	<span class="sort-option popular" class:selected={sortOption == 'popular'} onclick={popular}>Popular</span>
	<span class="sort-option published" class:selected={sortOption == 'published'} onclick={published}>Published</span> -->
	</div>
</div>

<div class="table">
	<div class="table-row">
		<div class="block"></div>
		<b class="block">Description</b>
		<div class="block table-headers">
			<b>Item</b>
			<b>Before</b>
			<b>After</b>
		</div>
	</div>
	{#each logs as log, index}
		{@const display = displayLog(log.before, log.after)}
		<div class="table-row" bind:this={logRows[index]}>
			<div class="block number">{logs.length - index}</div>
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
						<a title={log.name} class="shorten" href="/mission/{properUrlEncode(log.name)}">{log.name}</a>
					{:else}
						<span title={unlinkable(log.name)} class="shorten">{unlinkable(log.name)}</span>
					{/if}
				{:else if log.model === 'MissionPack'}
					{#if log.linkable}
						<a title={log.name} class="shorten" href="/missionpack/{properUrlEncode(log.name)}">{log.name}</a>
					{:else}
						<span title={unlinkable(log.name)} class="shorten">{unlinkable(log.name)}</span>
					{/if}
				{:else if log.model === 'Completion'}
					<span title={log.name} class="shorten">{log.name}</span> <span class="shorten">on</span> <br />
					{#if log.linkable && log.mission != null}
						<a title={log.mission} class="shorten" href="/mission/{properUrlEncode(log.mission)}">{log.mission}</a>
					{:else if log.mission != null}
						<span title={unlinkable(log.mission)} class="shorten">{unlinkable(log.mission)}</span>
					{:else}
						<span title={unlinkable(log.name)} class="shorten">{unlinkable(log.name)}</span>
					{/if}
				{:else if log.model === 'User'}
					{#if log.linkable}
						<a title={log.name} class="shorten" href="/user/{properUrlEncode(log.name)}">{log.name}</a>
					{:else}
						<span title={unlinkable(log.name)} class="shorten">{unlinkable(log.name)}</span>
					{/if}
				{/if}
				<br />
				{log.timestamp.toLocaleDateString(undefined, dateOptions)}
			</div>
			<div class="block dropdown d{index}" class:small={smallItem(display.full)} class:expand={smallItem(display.full)}>
				<div class="short" onclick={() => reveal(index)}>
					<div class="log-details">
						{#each display.short as row}
							<div title={row.item} class="shorten-detail">{row.item}</div>
							<div>{row.before}</div>
							<div>{row.after}</div>
						{/each}
					</div>
					<strong>...</strong>
				</div>
				<div class="full">
					<div class="contract" onclick={() => hide(index)}></div>
					<div class="log-details">
						{#each display.full as row}
							<div title={row.item} class="shorten-detail">{row.item}</div>
							<div>{row.before}</div>
							<div>{row.after}</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	:root {
		--cell-width: calc((var(--page-content-width) - 240px) / 2 - 80px);
	}

	.top-bar {
		position: sticky;
		top: calc(var(--stick-under-navbar) + 1px);
	}
	.search-bar {
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
		margin-top: var(--gap);
	}
	.hstack {
		display: flex;
		gap: 8px;
	}

	.shorten {
		max-width: 200px;
	}
	.shorten-detail {
		max-width: 115px;
	}
	.shorten,
	.shorten-detail {
		display: inline-block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		column-gap: var(--gap);
	}
	.table-headers b {
		text-align: left;
	}
	.table-row {
		display: grid;
		grid-template-columns: 30px 210px auto;
		gap: var(--gap);
		text-align: center;
		width: 100%;
		overflow: hidden;
		margin: var(--gap) auto;
	}
	.table-row > div {
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
