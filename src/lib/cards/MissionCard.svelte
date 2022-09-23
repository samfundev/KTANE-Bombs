<script lang="ts">
	import MissionCardInner from './MissionCardInner.svelte';
	import type { Mission } from '$lib/types';

	export let mission: Mission;
	export let selectable: boolean = false;
	export let selected: boolean = false;
	export let id: string = '';
	export let cardID: string = '';
	export let card: any = null;
</script>

{#if selectable}
	<div class="selectable-card" bind:this={card} id={cardID}>
		<input {id} type="checkbox" bind:checked={selected} />
		<label for={id} class="mission" class:selected>
			<MissionCardInner {mission} />
		</label>
	</div>
{:else}
	<a class="mission" bind:this={card} href="mission/{encodeURIComponent(mission.name)}" id={cardID}>
		<MissionCardInner {mission} />
	</a>
{/if}

<style>
	.mission {
		flex-grow: 1;

		display: grid;
		background: var(--foreground);
		padding: 10px;
		padding-right: 0;
		column-gap: 20px;

		grid-template-columns: 1fr 10px;
		grid-template-rows: auto auto;
		color: inherit;
		text-decoration: inherit;
	}

	input {
		display: none;
	}

	.selectable-card {
		display: contents;
	}

	.mission.selected {
		outline: var(--accent) 2px solid;
	}

	label {
		cursor: pointer;
	}
</style>
