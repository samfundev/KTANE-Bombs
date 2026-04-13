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
	let solverNames: string[] = data.solverNames;

	let dialog: HTMLDialogElement | undefined = $state();
	type SolveDetails = {
		title: string;
		desc: string;
		worseTime: boolean;
		old: { time: string; fir: boolean; seas: string }[];
		new: { time: string; fir: boolean; seas: string };
	};
	let solveDetails: SolveDetails = $state({
		title: '',
		desc: '',
		worseTime: false,
		old: [],
		new: { time: '', fir: false, seas: '' }
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

	function teamMatch(item: CompletionQueueItem, c: (typeof item.mission.completions)[0]) {
		return (
			c.solo == item.completion.solo &&
			JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
				JSON.stringify(item.completion.team.slice(0, 1).concat(item.completion.team.slice(1).sort()))
		);
	}

	// Category 1: Solve being added that would replace at least one solve
	function solvesToReplace(item: CompletionQueueItem) {
		let indicies: number[] = [];
		item.mission.completions.forEach((c, idx) => {
			if (
				teamMatch(item, c) &&
				!c.first &&
				//new one is season and (old one is not season or is the same season)
				//or neither new or old one is season
				((item.completion.season != null &&
					((c.season == null && c.time < item.completion.time) || c.season?.id === item.completion.season.id)) ||
					(item.completion.season == null && c.season == null))
			)
				indicies.push(idx);
		});
		return indicies;
	}

	// Category 2: Solve being added that would be an additional duplicate solve
	function duplicateSolves(item: CompletionQueueItem) {
		let indicies: number[] = [];
		item.mission.completions.forEach((c, idx) => {
			if (teamMatch(item, c)) indicies.push(idx);
			// 	teamMatch(item, c) &&
			// 	(c.first || //queue items never have first==true
			// 		// (c.season?.id ?? null) === (item.completion.season?.id ?? null)) || //same season or both non-season solves
			// 	c.season != null)
			// )
			// 	indicies.push(idx);
		});
		return indicies;
	}

	async function verify(item: QueueItem, accept: boolean) {
		let replaceIds: number[] = [];
		if (accept && item.type == 'completion') {
			if (solverNames?.length > 0) {
				let uNames = uniqueNames(item.completion.team);
				if (uNames.length > 0) {
					let conf = `Are you sure? These names are NOT currently credited with any solves: ${uNames.join(', ')}`;
					if (!confirm(conf)) return;
				}
			}
			let replacing = solvesToReplace(item);
			let equalSolves = duplicateSolves(item);

			if (replacing.length > 0) {
				replaceIds = replacing.map(idx => item.mission.completions[idx].id);
				const worseTime = replacing.every(idx => item.completion.time < item.mission.completions[idx].time);
				const confirmed = await showConfirm({
					title: 'Replacement Solve Details',
					desc: `This solve will replace the "Old" solve${replacing.length > 1 ? 's' : ''} shown below.`,
					worseTime,
					old: replacing.map(idx => ({
						time: formatTime(item.mission.completions[idx].time),
						fir: item.mission.completions[idx].first,
						seas: item.mission.completions[idx].season?.name ?? NO_SEASON
					})),
					new: {
						time: formatTime(item.completion.time),
						fir: item.completion.first,
						seas: item.completion.season?.name ?? NO_SEASON
					}
				});
				if (!confirmed) return;
			} else if (equalSolves.length > 0) {
				const worseTime =
					(item.completion.season == null &&
						equalSolves.every(idx => item.completion.time < item.mission.completions[idx].time)) ||
					equalSolves.some(idx => item.completion.time < item.mission.completions[idx].time);
				const confirmed = await showConfirm({
					title: 'Allowed Duplicate Solve Details',
					desc: 'This will be an additional solve. Duplicates shown below.',
					worseTime,
					old: equalSolves.map(idx => ({
						time: formatTime(item.mission.completions[idx].time),
						fir: item.mission.completions[idx].first,
						seas: item.mission.completions[idx].season?.name ?? NO_SEASON
					})),
					new: {
						time: formatTime(item.completion.time),
						fir: item.completion.first,
						seas: item.completion.season?.name ?? NO_SEASON
					}
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
					replaceIds
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
		<p class="sh">
			{solveDetails.desc}
			{#if solveDetails.worseTime}
				<br /><span class="red"><b>WARNING: This is NOT an improved time.</b></span>
			{:else}
				<br /><span>This is an improved time.</span>
			{/if}
		</p>
		<table class="solve-replace">
			<thead>
				<tr>
					<th></th>
					<th>Time</th>
					<th>First*</th>
					<th>Season</th>
				</tr>
			</thead>
			<tbody>
				{#each solveDetails.old as solve}
					<tr>
						<td>Old</td>
						<td>{solve.time}</td>
						<td>{solve.fir ? 'Yes' : 'No'}</td>
						<td>{solve.seas}</td>
					</tr>
				{/each}
				<tr class="new">
					<td>New</td>
					<td>{solveDetails.new.time}</td>
					<td>{solveDetails.new.fir ? 'Yes' : 'No'}</td>
					<td>{solveDetails.new.seas}</td>
				</tr>
			</tbody>
		</table>
		<span class="small">* Global first solve of the mission</span>
		<div class="flex right">
			<button class="info-button" onclick={handleConfirmCancel}>Cancel</button>
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
				<div class="block flex content-width" style="align-items: center;">
					<button onclick={() => verify(item, true)}>Accept</button>
					<button onclick={() => verify(item, false)}>Reject</button>
				</div>
			{:else if item.type === 'completion'}
				{@const replacing = solvesToReplace(item)}
				{@const equalSolves = duplicateSolves(item)}
				<CompletionCard completion={item.completion} />
				<div class="block completion-uploaded-by">
					Uploaded by:<br />{item.completion.uploadedBy}
					{#if item.completion.season}
						<br /><span class="green">Season</span>
					{/if}
					{#if replacing.length > 0}
						<br /><span class="red">Resubmission</span>
					{:else if equalSolves.length > 0}
						<br /><span class="red">Duplicate</span>
					{/if}
				</div>
				<MissionCard mission={item.mission} />
				<div class="block flex content-width" style="align-items: center;">
					<button class:info-button={replacing.length > 0 || equalSolves.length > 0} onclick={() => verify(item, true)}
						>{replacing.length > 0 || equalSolves.length > 0 ? 'Details' : 'Accept'}</button>
					<button onclick={() => verify(item, false)}>Reject</button>
				</div>
			{:else if item.type === 'missionpack'}
				<div class="block">
					<a href="/missionpack/{properUrlEncode(item.pack.name)}">{item.pack.name}</a>
				</div>
				<div class="block flex content-width" style="align-items: center;">
					<button onclick={() => verify(item, true)}>Accept</button>
					<button onclick={() => verify(item, false)}>Reject</button>
				</div>
			{/if}
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
	p.sh {
		margin-top: 0;
	}
	span.small {
		font-size: 80%;
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
	table.solve-replace tbody tr.new td,
	table.solve-replace thead th {
		font-weight: bold;
	}

	.info-button {
		background-color: #bbb;
		color: #000;
		border-color: #000;
	}
	.item-details-dialog button {
		cursor: pointer;
	}
	.item-details-dialog > p {
		white-space: pre;
	}
	.info-button:hover {
		background-color: #aaa;
	}
	.flex.right {
		justify-content: flex-end;
	}
</style>
