<script lang="ts">
	import type { CompletionQueueItem, QueueItem } from '$lib/types';
	import MissionCard from '$lib/cards/MissionCard.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	import { formatTime, properUrlEncode } from '$lib/util';
	import { MISSION_UPDATE, NO_SEASON } from '$lib/const.js';
	import Dialog from '$lib/controls/Dialog.svelte';
	let { data } = $props();
	let queue: QueueItem[] = $state(data.queue);
	let currentSeasonName: string = data.currentSeasonName;
	let solverNames: string[] = data.solverNames;

	let dialog: HTMLDialogElement | undefined = $state();
	type SolveDetails = { title: string; time1: string; time2: string; seas1: string; seas2: string; fir1: boolean; fir2: boolean };
	let solveDetails: SolveDetails = $state({
		title: '',
		time1: '',
		time2: '',
		seas1: '',
		seas2: '',
		fir1: false,
		fir2: false
	});
	let resolveConfirm: ((value: boolean) => void) | null = null;

	function showConfirm(details: SolveDetails): Promise<boolean> {
		solveDetails = details;
		dialog?.showModal();
		return new Promise(resolve => {
			resolveConfirm = resolve;
		});
	}

	function handleConfirmAccept() {
		dialog?.close();
		resolveConfirm?.(true);
		resolveConfirm = null;
	}

	function handleConfirmCancel() {
		dialog?.close();
		resolveConfirm?.(false);
		resolveConfirm = null;
	}

	function uniqueNames(names: string[]): string[] {
		return names.filter(n => !solverNames.some(sn => sn.toLowerCase() === n.toLowerCase()));
	}

	function matchingSolve(item: CompletionQueueItem) {
		return item.mission.completions.findIndex(
			c =>
				c.season?.id == (item.completion.season?.id ?? null) &&
				c.first == item.completion.first &&
				c.solo == item.completion.solo &&
				JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
					JSON.stringify(item.completion.team.slice(0, 1).concat(item.completion.team.slice(1).sort()))
		);
	}

	function addingToFirstSolve(item: CompletionQueueItem) {
		return item.mission.completions.findIndex(
			c =>
				c.first !== item.completion.first &&
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
			let addingToFirst = addingToFirstSolve(item);
			if (addingToFirst >= 0) {
				const confirmed = await showConfirm({
					title: 'In Addition to First Solve',
					time1: formatTime(item.mission.completions[addingToFirst].time),
					time2: formatTime(item.completion.time),
					seas1: item.mission.completions[addingToFirst].season?.name ?? NO_SEASON,
					seas2: item.completion.season?.name ?? NO_SEASON,
					fir1: item.mission.completions[addingToFirst].first,
					fir2: item.completion.first
				});
				if (!confirmed) return;
			}
			equalSolve = matchingSolve(item);
			if (equalSolve >= 0) {
				const confirmed = await showConfirm({
					title: 'Replacement Solve Details',
					time1: formatTime(item.mission.completions[equalSolve].time),
					time2: formatTime(item.completion.time),
					seas1: item.mission.completions[equalSolve].season?.name ?? NO_SEASON,
					seas2: item.completion.season?.name ?? NO_SEASON,
					fir1: item.mission.completions[equalSolve].first,
					fir2: item.completion.first
				});
				if (!confirmed) return;
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

<div class="block top-bar">
	<a class="audit-log" href="/auditlog">Audit Log</a>
	<h1 class="header">Verify Queue</h1>
</div>

<Dialog bind:dialog>
	<div class="flex column item-details-dialog">
		<h2>{solveDetails.title}</h2>
		<table class="solve-replace">
			<thead>
				<tr>
					<th>Property</th>
					<th>Old</th>
					<th>New</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Time</td>
					<td>{solveDetails.time1}</td>
					<td>{solveDetails.time2}</td>
				</tr>
				<tr>
					<td>First</td>
					<td>{solveDetails.fir1 ? 'Yes' : 'No'}</td>
					<td>{solveDetails.fir2 ? 'Yes' : 'No'}</td>
				</tr>
				<tr>
					<td>Season</td>
					<td>{solveDetails.seas1}</td>
					<td>{solveDetails.seas2}</td>
				</tr>
			</tbody>
		</table>
		<div class="flex right">
			<button class="cancel-button" onclick={handleConfirmCancel}>Cancel</button>
			<button class="accept-button" onclick={handleConfirmAccept}>Accept</button>
		</div>
	</div>
</Dialog>

<div class="flex column">
	{#each queue as item (item)}
		<div class="item {item.type}">
			{#if item.type === 'mission'}
				<div>
					<MissionCard mission={item.mission} />
					{#if item.mission.name.startsWith(MISSION_UPDATE)}
						<div class="block red">
							This would update the parameters of the mission: {item.mission.name.substring(11)}
						</div>
					{/if}
				</div>
			{:else if item.type === 'completion'}
				<CompletionCard completion={item.completion} {currentSeasonName} />
				<div class="block completion-uploaded-by">
					Uploaded by:<br />{item.completion.uploadedBy}
					{#if item.completion.season}
						<br /><span class="green">Season</span>
					{/if}
					{#if addingToFirstSolve(item) >= 0}
						<br /><span class="red">Add to First</span>
					{/if}
					{#if matchingSolve(item) >= 0}
						<br /><span class="red">Resubmission</span>
					{/if}
				</div>
				<MissionCard mission={item.mission} />
			{:else if item.type === 'missionpack'}
				<div class="block">
					<a href="/missionpack/{properUrlEncode(item.pack.name)}">{item.pack.name}</a>
				</div>
			{/if}
			<div class="block flex content-width" style="align-items: center;">
				<button onclick={() => verify(item, true)}>Accept</button>
				<button onclick={() => verify(item, false)}>Reject</button>
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
		grid-template-columns: 1fr 0.3fr 1fr auto;
	}
	:is(:global(span, .block)).red {
		color: red;
	}
	:is(span, .block).green {
		color: #009c0a;
	}

	.completion-uploaded-by {
		word-break: break-all;
	}

	.top-bar {
		position: relative;
	}
	.audit-log {
		position: absolute;
		top: var(--gap);
		left: var(--gap);
	}

	table.solve-replace {
		border-collapse: collapse;
	}
	table.solve-replace :is(th, td) {
		border: 1px solid var(--textbox-background);
		padding: 0.25rem 0.5rem;
	}
	table.solve-replace tbody td {
		text-align: center;
	}
	table.solve-replace tbody td:nth-child(3),
	table.solve-replace thead th {
		font-weight: bold;
	}

	.cancel-button {
		background-color: #bbb;
		color: #000;
		border-color: #000;
	}
	.item-details-dialog button {
		cursor: pointer;
	}
	.cancel-button:hover {
		background-color: #aaa;
	}
	.flex.right {
		justify-content: flex-end;
	}
</style>
