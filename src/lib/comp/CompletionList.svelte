<script lang="ts">
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	import { TP_TEAM } from '$lib/const';
	import type { Mission } from '$lib/types';

	export let mission: Pick<Mission, 'completions' | 'tpSolve'>;
	let tpSolve = mission.completions.find(c => c.team[0] === TP_TEAM);

	$: mission.completions.sort((a, b) => b.time - a.time);
</script>

<div class="completions">
	{#each mission.completions as completion}
		<CompletionCard {completion} />
	{:else}
		<NoContent>No solves, <a href="/upload">be the first</a>!</NoContent>
	{/each}
	{#if mission.tpSolve && tpSolve === undefined}
		<div class="block">Solved by <span class="tp-solve">{TP_TEAM}</span></div>
	{/if}
</div>

<style>
	.completions {
		display: flex;
		flex-direction: column;
		grid-template-columns: 1fr;
		gap: var(--gap);
	}

	.tp-solve {
		padding: 1px 3px;
		border-radius: 5px;
		background-color: #9146ff;
		color: #fff;
	}
</style>
