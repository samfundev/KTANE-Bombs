<script lang="ts">
	import { Permission } from '$lib/types';
	import { hasPermission, pluralize } from '$lib/util';
	import { page } from '$app/stores';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import type { EditMissionPack } from '../_types';

	export let data;
	export let pack: EditMissionPack = data.pack;

	let dateAdded = new Date(0);
	dateAdded.setUTCSeconds(pack.dateAdded ?? 0);
	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
</script>

<svelte:head>
	<title>{pack.name}</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">{pack.name}</h1>
	<div class="flex">
		<span>{pluralize(pack.missions.length, 'Mission')}</span>
		{#if pack.dateAdded !== null}
			<span class="date">{dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
		{/if}
		<a class="steam" href="https://steamcommunity.com/sharedfiles/filedetails/?id={pack.steamId}">Steam Workshop</a>
	</div>
	{#if hasPermission($page.data.user, Permission.VerifyMissionPack)}
		<a href={$page.url.href + '/edit'} class="top-right">Edit</a>
	{/if}
</div>
{#if !pack.verified}
	<div class="block centered not-verified">This mission pack has not been verified.</div>
{/if}
<div class="main-content mission-card-grid">
	{#each pack.missions as mission}
		<MissionCard {mission} />
	{/each}
</div>

<style>
	.main-content {
		display: grid;
		gap: var(--gap);
	}

	.not-verified {
		color: red;
	}

	.centered {
		text-align: center;
	}
	a.steam {
		color: var(--text-color);
	}

	.flex {
		justify-content: center;
		gap: 30px;
	}

	.header {
		font-weight: bold;
		text-align: center;
	}

	.top-right {
		position: absolute;
		color: var(--text-color);
		top: var(--gap);
		right: var(--gap);
	}
</style>
