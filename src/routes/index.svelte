<script lang="ts">
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import HomeSearchBar from '$lib/home/HomeSearchBar.svelte';
	import type { Mission } from '$lib/types';
	import type { RepoModule } from '$lib/repo';

	export let missions: Mission[];
	export let missionCards: any = {};
	export let modules: RepoModule[];

	let render = false;
	let searchBar: HomeSearchBar;

	function onChange() {
		render = true; 			//don't render until first sort has finished on page load
		missions = missions;	//signals svelte to rerender the bombs section
	}
</script>

<svelte:head>
	<title>Challenge Bombs</title>
</svelte:head>
<h1 class="header">Challenge Bombs</h1>
<HomeSearchBar bind:this={searchBar} bind:missions={missions} bind:missionCards={missionCards} on:change={onChange} {modules}/>
<div class="bombs">
	{#each missions as mission, index (mission.name)}
		{#if render}
			<MissionCard {mission} 
				id={'mission-input-' + index} cardID={'mission-' + mission.name}
				bind:card={missionCards[mission.name]}/>
		{/if}
	{/each}
</div>

<style>
	.bombs {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--gap);
	}
</style>
