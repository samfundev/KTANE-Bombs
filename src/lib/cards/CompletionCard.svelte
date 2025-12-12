<script lang="ts">
	import { TP_TEAM } from '$lib/const';
	import type { Completion } from '$lib/types.svelte';
	import { classifyLink, formatTime, getPersonColor, popup } from '$lib/util';

	interface Props {
		completion: Completion;
	}

	let { completion }: Props = $props();

	let tp = $derived(completion.team[0] === TP_TEAM);
	let note = $state() as HTMLDivElement;
	let noteIcon = $state() as HTMLButtonElement;
</script>

<div class="completion">
	<span class="time" class:first={completion.first} class:old={completion.old} title={formatTime(completion.time, true)}
		>{formatTime(completion.time)}</span>
	<div class="flex notes">
		<div class="team">
			{#each completion.team as person, i}
				<span
					class="person"
					class:tp-solve={tp}
					style="background-color: {getPersonColor(completion.team.length, i, completion.solo, tp)}">{person}</span>
			{/each}
		</div>
		{#if completion.notes !== null}
			<button
				class="note reset"
				bind:this={noteIcon}
				onclick={() => popup(note, noteIcon, true)}
				title={completion.notes}
				aria-label="Notes"></button>
			<div bind:this={note} class="popup disappear disappear-stat0 hidden">
				<span class="popup-text">{completion.notes}</span>
			</div>
		{/if}
	</div>
	<div class="flex column proof">
		{#each completion.proofs as proof}
			<a href={proof}>{classifyLink(proof)}</a>
		{/each}
	</div>
</div>

<style>
	.completion {
		display: grid;
		grid-template-columns: auto 1fr 27px;
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
		flex: 1;
		gap: var(--gap);
	}
	.tp-solve {
		color: #fff;
	}
	.proof {
		align-items: flex-end;
	}
	.proof a {
		color: var(--link-text-color);
	}

	.note {
		background-image: url('$lib/img/note.png');
		background-size: contain;
		background-repeat: no-repeat;
		width: 20px;
		height: 28px;
		cursor: pointer;
	}
	.notes {
		align-items: center;
	}
	.popup {
		padding: 0.5em;
	}
	.popup-text {
		white-space: pre;
	}
</style>
