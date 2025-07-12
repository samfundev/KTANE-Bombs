<script lang="ts">
	import { TP_TEAM } from '$lib/const';
	import { type MissionCompletion } from '$lib/types';
	import { formatTime, getPersonColor, currSeason, pastSeason, properUrlEncode } from '$lib/util';

	interface Props {
		comp: MissionCompletion;
		username: string;
		showTime?: boolean;
		currentSeasonName: string;
	}

	let { comp, username, showTime = false, currentSeasonName = '' }: Props = $props();

	let tp = username === TP_TEAM;
	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
</script>

<a href="/mission/{properUrlEncode(comp.mission.name)}">
	<div
		class="block flex full"
		style:background-color={getPersonColor(comp.team.length, comp.team.indexOf(username), comp.solo, tp)}>
		{#if comp.time !== undefined && showTime}
			<span class="time" class:first={comp.first} class:old={comp.old} title={formatTime(comp.time, true)}
				>{formatTime(comp.time)}</span>
		{/if}
		<div class="flex name-box">
			<div
				class="season-solve"
				class:current-season-solve={currSeason(comp.season, currentSeasonName)}
				class:past-season-solve={pastSeason(comp.season, currentSeasonName)}>
			</div>
			<span
				class="mission-name"
				class:current-season-solve={currSeason(comp.season, currentSeasonName)}
				class:past-season-solve={pastSeason(comp.season, currentSeasonName)}>
				{comp.mission.name}
			</span>
		</div>
		{#if comp.dateAdded}
			<span>{comp.dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
		{/if}
	</div>
</a>

<style>
	.flex.name-box {
		align-items: center;
	}
	div.season-solve {
		display: inline-block;
		width: 14px;
		height: 16px;
	}
	.current-season-solve {
		font-weight: bold;
	}
	.season-solve.current-season-solve {
		background: url('$lib/img/S-fancy.svg');
		background-repeat: no-repeat;
	}
	.past-season-solve {
		font-weight: bold;
	}
	.season-solve.past-season-solve {
		background: url('$lib/img/S-angular.svg');
		height: 14px;
		width: 16px;
		background-repeat: no-repeat;
	}
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
