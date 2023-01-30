<script lang="ts">
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import HomeSearchBar from '$lib/home/HomeSearchBar.svelte';
	import type { Mission } from '$lib/types';
	import type { RepoModule } from '$lib/repo';
	import { popup, preventDisappear } from '$lib/util';
	import HomeInfoMenu from '$lib/home/HomeInfoMenu.svelte';

	export let data;
	let missions: Mission[] = data.missions;
	let missionCards: any = {};
	let modules: Record<string, RepoModule> = data.modules;

	let render = false;
	let searchBar: HomeSearchBar;
	let infoMenu: HTMLDivElement;
	let infoTab: HTMLDivElement;

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

	<div class="tab-holder" bind:this={infoTab}>
		<div class="popup-tab info-tab" on:click={() => popup(infoMenu, infoTab, true, [8, 6])}>Info</div>
	</div>
	<HomeInfoMenu bind:div={infoMenu} on:click={() => preventDisappear(infoMenu)} />
</div>
<HomeSearchBar bind:this={searchBar} bind:missions bind:missionCards on:change={onChange} {modules} />
<div class="bombs">
	{#each missions as mission, index (mission.name)}
		{#if render}
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
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--gap);
	}
	.info-tab {
		background-image: url('$lib/img/info-icon.png');
	}
	.tab-holder {
		position: absolute;
		right: var(--gap);
		bottom: var(--gap);
	}
</style>
