<script lang="ts">
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import HomeSearchBar from '$lib/home/HomeSearchBar.svelte';
	import type { RepoModule } from '$lib/repo';
	import { Bomb, Filterable, FilterableGroup, type Mission } from '$lib/types';
	import { onMount } from 'svelte';
	import { group_outros } from 'svelte/internal';

	export let missions: Mission[];
	export let modules: RepoModule[];
	export let group: FilterableGroup = new FilterableGroup();

	missions.forEach((m,i) => {
		group.g[i] = new Filterable(m);
	});

	function onChange() {
		group = group;	//signals svelte to rerender the bombs section
	}
</script>

<svelte:head>
	<title>Challenge Bombs</title>
</svelte:head>
<h1 class="header">Challenge Bombs</h1>
<HomeSearchBar bind:group={group} on:change={onChange} {modules}/>
<div class="bombs">
	{#each group.g as mission, index}
		{#if !mission.Hidden}
			<MissionCard mission={mission.o} id={'mission-' + index}/>
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
