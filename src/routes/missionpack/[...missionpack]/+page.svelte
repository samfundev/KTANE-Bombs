<script lang="ts">
	import { Permission } from '$lib/types.svelte';
	import { hasPermission, pluralize, properUrlEncode } from '$lib/util';
	import { page } from '$app/stores';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import type { EditMissionPack } from '../_types';

	interface Props {
		data: any;
		pack?: EditMissionPack;
	}

	let { data, pack = data.pack }: Props = $props();

	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
	// const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
</script>

<svelte:head>
	<title>{pack.name}</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">{pack.name}</h1>
	<div class="flex">
		<span>{pluralize(pack.missions.length, 'Mission')}</span>
		{#if pack.dateAdded !== null}
			<span class="date">{pack.dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
		{/if}
		<a class="steam" href="https://steamcommunity.com/sharedfiles/filedetails/?id={pack.steamId}">Steam Workshop</a>
		{#if pack.uploadedBy}
			<span>Uploaded by: <a href="/user/{properUrlEncode(pack.uploadedBy)}">{pack.uploadedBy}</a></span>
		{/if}
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
