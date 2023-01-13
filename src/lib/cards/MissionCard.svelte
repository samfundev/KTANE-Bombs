<script lang="ts">
	import MissionCardInner from './MissionCardInner.svelte';
	import type { Mission } from '$lib/types';
	import { getSolveTypes, listify } from '$lib/util';

	export let mission: Mission;
	export let selectable: boolean = false;
	export let selected: boolean = false;
	export let id: string = '';
	export let cardID: string = '';
	export let card: any = null;

	const solveTypes = getSolveTypes(mission);

	const solvers = [
		solveTypes.normalSolve ? 'by a team' : null,
		solveTypes.efmSolve ? 'via EFM' : null,
		mission.tpSolve ? 'on Twitch Plays' : null,
		solveTypes.soloSolve ? 'solo' : null
	].flatMap(solver => solver ?? []);
	const title =
		solvers.length === 0 ? "This mission hasn't been solved." : `This mission has been solved ${listify(solvers)}.`;
</script>

{#if selectable}
	<div class="selectable-card" bind:this={card} id={cardID}>
		<input {id} type="checkbox" bind:checked={selected} />
		<label for={id} class="mission selectable" class:selected>
			<MissionCardInner {mission} />
		</label>
	</div>
{:else}
	<a class="mission" bind:this={card} href="/mission/{encodeURIComponent(mission.name)}" id={cardID}>
		<div />
		<MissionCardInner {mission} />
		<div class="indicator flex column" {title}>
			<span class:hidden={!solveTypes.normalSolve} style="background-color: hsl(210, 100%, 65%); color:#000">T</span>
			<span class:hidden={!solveTypes.efmSolve} style="background-color: hsl(300, 100%, 75%); color:#000">E</span>
			<span class:hidden={!mission.tpSolve} style="background-color: #9146ff; color:#FFF">TP</span>
			<span class:hidden={!solveTypes.soloSolve} style="background-color: #00ffff; color:#000">S</span>
		</div>
		<div />
	</a>
{/if}

<style>
	.mission {
		flex-grow: 1;

		display: grid;
		background: var(--foreground);
		padding: 0 0 0 10px;
		column-gap: 20px;

		grid-template-columns: 1fr 20px;
		grid-template-rows: 10px auto auto 10px;
		color: inherit;
		text-decoration: inherit;
	}
	.mission.selectable {
		padding: 10px;
		padding-right: 0;
		grid-template-columns: 1fr;
		grid-template-rows: auto auto;
	}

	.indicator {
		grid-column: 2;
		grid-row: 1 / span 4;
		justify-content: center;
		gap: 0;
	}
	.indicator > span {
		font-size: 12.5px;
		text-align: center;
		padding: 3px 2px 1px;
		line-height: 1;
	}
	.hidden {
		display: none;
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
