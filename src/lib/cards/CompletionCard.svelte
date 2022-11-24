<script lang="ts">
	import type { Completion } from '$lib/types';
	import { formatTime, getPersonColor } from '$lib/util';

	export let completion: Completion;
</script>

<div class="completion">
	<span class="time" class:first={completion.first} class:old={completion.old} title={formatTime(completion.time, true)}
		>{formatTime(completion.time)}</span>
	<div class="team">
		{#each completion.team as person, i}
			<span class="person" style="background-color: {getPersonColor(completion.team.length, i, completion.solo)}"
				>{person}</span>
		{/each}
	</div>
	<div class="flex column">
		{#each completion.proofs as proof}
			<a href={proof}>Link</a>
		{/each}
	</div>
</div>

<style>
	.completion {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: min-content;
		align-content: center;
		align-items: center;
		gap: var(--gap);

		padding: var(--gap);
		background: var(--foreground);
	}

	.completion .time {
		padding: 0 3px;
	}

	.completion .first {
		border-radius: 5px;
		color: black;
		background-color: hsl(43, 74%, 70%);
	}

	.completion .old {
		font-style: italic;
	}

	.person {
		border-radius: 5px;
		padding: 1px 3px;
		color: black;
	}

	.team {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
	}
</style>
