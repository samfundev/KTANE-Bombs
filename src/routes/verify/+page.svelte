<script lang="ts">
	import type { CompletionQueueItem, QueueItem } from '$lib/types';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	import { formatTime } from '$lib/util';
	export let data;
	let queue: QueueItem[] = data.queue;
	let solverNames: string[] = data.solverNames;

	function uniqueNames(names: string[]): string[] {
		return names.filter(n => !solverNames.some(sn => sn.toLowerCase() === n.toLowerCase()));
	}

	function matchingSolve(item: CompletionQueueItem) {
		return item.mission.completions.findIndex(
			c =>
				c.solo == item.completion.solo &&
				JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
					JSON.stringify(item.completion.team.slice(0, 1).concat(item.completion.team.slice(1).sort()))
		);
	}

	async function verify(item: QueueItem, accept: boolean) {
		let equalSolve = -1;
		if (accept && item.type == 'completion') {
			if (solverNames?.length > 0) {
				let uNames = uniqueNames(item.completion.team);
				if (uNames.length > 0) {
					let conf = `Are you sure? These names are NOT currently credited with any solves: ${uNames.join(', ')}`;
					if (!confirm(conf)) return;
				}
			}
			equalSolve = matchingSolve(item);
			if (equalSolve >= 0) {
				let conf = `Are you sure? This will replace an existing solve of time: ${formatTime(
					item.mission.completions[equalSolve].time
				)}`;
				if (!confirm(conf)) return;
			}
		}
		try {
			await fetch('verify/item', {
				method: 'POST',
				body: JSON.stringify({
					item,
					accept,
					replaceId: equalSolve >= 0 ? (item as CompletionQueueItem).mission.completions[equalSolve].id : -1
				})
			});
		} catch (error) {
			console.error('Failed to verify item.', error);
			return;
		}

		queue = queue.filter(otherItem => otherItem !== item);
	}
</script>

<svelte:head>
	<title>Verify Queue</title>
</svelte:head>

<h1 class="header">Verify Queue</h1>

<div class="flex column">
	{#each queue as item, index (item)}
		<div class="item {item.type}">
			{#if item.type === 'mission'}
				<div>
					<MissionCard mission={item.mission} />
					{#if item.mission.name.startsWith('[[UPDATE]] ')}
						<div class="block red">
							This would update the parameters of the mission: {item.mission.name.substring(11)}
						</div>
					{/if}
				</div>
			{:else if item.type === 'completion'}
				<CompletionCard completion={item.completion} />
				<div class="block">Uploaded by:<br>{item.completion.uploadedBy}</div>
				<MissionCard mission={item.mission} />
			{:else if item.type === 'missionpack'}
				<div class="block">
					<a href="/missionpack/{encodeURIComponent(item.pack.name)}">{item.pack.name}</a>
				</div>
			{/if}
			<div class="block flex content-width" style="align-items: center;">
				<button on:click={() => verify(item, true)}>Accept</button>
				<button on:click={() => verify(item, false)}>Reject</button>
			</div>
		</div>
	{:else}
		<NoContent>Nothing to be verified.</NoContent>
	{/each}
</div>

<style>
	.item {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--gap);
	}

	.item.completion {
		grid-template-columns: 1fr .3fr 1fr auto;
	}
	.block.red {
		color: red;
	}
</style>
