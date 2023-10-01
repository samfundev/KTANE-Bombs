<script lang="ts">
	import { TP_TEAM } from '$lib/const';
	import type { MissionCompletion } from '$lib/types';
	import { formatTime, getPersonColor, listify } from '$lib/util';

	export let comp: MissionCompletion;
	export let username: string;
	export let showTime: boolean = false;

	let tp = username === TP_TEAM;
	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
</script>

<a href="/mission/{encodeURIComponent(comp.mission.name)}">
	<div
		class="block flex full"
		style:background-color={getPersonColor(comp.team.length, comp.team.indexOf(username), comp.solo, tp)}>
		{#if comp.time !== undefined && showTime}
			<span class="time" class:first={comp.first} class:old={comp.old} title={formatTime(comp.time, true)}
				>{formatTime(comp.time)}</span>
		{/if}
		<span class="mission-name">{comp.mission.name}</span>
		{#if comp.dateAdded}
			<span>{comp.dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
		{/if}
	</div>
</a>

<style>
	.full {
		justify-content: space-between;
		gap: 20px;
	}
	.time {
		padding: 0 3px;
	}
	.time.first {
		border-radius: 5px;
		color: black;
		background-color: hsl(43, 74%, 70%);
	}
	.time.old {
		font-style: italic;
	}
	a {
		text-decoration: none;
		color: black;
	}
	.mission-name {
		text-decoration: underline;
	}
</style>
