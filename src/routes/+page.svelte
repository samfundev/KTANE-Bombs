<script lang="ts">
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import HomeSearchBar from '$lib/home/HomeSearchBar.svelte';
	import type { ID, Mission } from '$lib/types';
	import type { RepoModule } from '$lib/repo';

	export let data;
	let missions: ID<Mission>[] = data.missions;
	let missionCards: any = {};
	let modules: Record<string, RepoModule> | null = data.modules;

	let render = false;
	let searchBar: HomeSearchBar;

	function onChange() {
		if (!render)
			setTimeout(() => {
				searchBar.updateSearch();
			}, 200);
		render = true; //don't render until first sort has finished on page load
		missions = missions; //signals svelte to rerender the bombs section
	}
</script>

<svelte:head>
	<title>Challenge Bombs</title>
</svelte:head>
<div class="relative">
	<h1 class="header">Challenge Bombs</h1>
</div>
{#if modules}
	<HomeSearchBar bind:this={searchBar} bind:missions bind:missionCards on:change={onChange} {modules} />
{:else}
	<div class="block">Error fetching module info from the repo.</div>
{/if}
<div class="bombs mission-card-grid">
	{#each missions as mission, index (mission.name)}
		{#if render || modules === null}
			<MissionCard
				{mission}
				id={'mission-input-' + index}
				cardID={'mission-' + mission.name}
				bind:card={missionCards[mission.name]} />
		{/if}
	{/each}
</div>

<style>
	.bombs {
		width: 100%;
		height: 100%;
		display: grid;
		gap: var(--gap);
	}
</style>
