<script lang="ts">
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	import { TP_TEAM } from '$lib/const';
	import type { Mission } from '$lib/types';
	import { classifyLink } from '$lib/util';

	interface Props {
		mission: Pick<Mission, 'completions' | 'tpSolve'>;
	}

	let { mission }: Props = $props();
	let tpSolve = mission.completions.find(c => c.team[0] === TP_TEAM);

	let sortedCompletions = $derived(mission.completions.toSorted((a, b) => b.time - a.time));
</script>

<div class="completions">
	{#each sortedCompletions as completion}
		{#if completion.team[0] !== TP_TEAM}
			<!-- TP solves excluded from leaderboard by popular request -->
			<CompletionCard {completion} />
		{/if}
	{:else}
		<NoContent>No solves, <a href="/upload">be the first</a>!</NoContent>
	{/each}
	{#if mission.tpSolve}
		<div class="block tp-solve-block">
			<div><span>Solved using</span> <span class="tp-solve">{TP_TEAM}</span></div>
			<div class="flex column proof">
				{#if tpSolve != undefined}
					{#each tpSolve.proofs as proof}
						<a href={proof}>{classifyLink(proof)}</a>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.completions {
		display: flex;
		flex-direction: column;
		grid-template-columns: 1fr;
		gap: var(--gap);
	}

	a {
		color: var(--text-color);
	}

	.tp-solve {
		padding: 1px 3px;
		border-radius: 5px;
		background-color: #9146ff;
		color: #fff;
	}

	.tp-solve-block {
		display: grid;
		grid-template-columns: auto 27px;
	}
</style>
