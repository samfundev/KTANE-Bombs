<script lang="ts">
	import type { QueueItem } from '$lib/types';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	export let data;
	let queue: QueueItem[] = data.queue;
	let solverNames: string[] = data.solverNames;

	function uniqueNames(names: string[]): string[] {
		return names.filter(n => !solverNames.some(sn => sn.toLowerCase() === n.toLowerCase()));
	}

	async function verify(item: QueueItem, accept: boolean) {
		if (accept && item.type == 'completion' && solverNames?.length > 0) {
			let uNames = uniqueNames(item.completion.team);
			if (uNames.length > 0) {
				let conf = `Are you sure? These names are NOT currently credited with any solves: ${uNames.join(', ')}`;
				if (!confirm(conf)) return;
			}
		}
		try {
			await fetch('verify/item', {
				method: 'POST',
				body: JSON.stringify({
					item,
					accept
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
				<MissionCard mission={item.mission} />
			{:else if item.type === 'completion'}
				<CompletionCard completion={item.completion} />
				<MissionCard mission={item.mission} />
			{:else if item.type === 'missionpack'}
				<div class="block">
					<a href="https://steamcommunity.com/sharedfiles/filedetails/?id={item.pack.steamId}">
						{item.pack.name}
					</a>
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
		grid-template-columns: 1fr 1fr auto;
	}
</style>
