<script lang="ts">
	import type { IndividualCompletion } from '$lib/types';
	import { getPersonColor, listify } from '$lib/util';

	export let mission: IndividualCompletion;
	export let username: string;
	const methods = [
		mission.defuser ? 'as a Defuser' : null,
		mission.expert ? 'as an Expert' : null,
		mission.efm ? 'via EFM' : null,
		mission.solo ? 'solo' : null
	].flatMap(method => method ?? []);
	const title = `${username} solved this mission ${listify(methods)}.`;
</script>

<a class="mission" href="/mission/{encodeURIComponent(mission.name)}">
	<div class="mission-name" class:green={mission.defuser && mission.expert && mission.efm}>
		{mission.name}
	</div>
	<div {title}>
		{#if username === 'Twitch Plays'}
			<div class="hspace" style="background-color: {getPersonColor(1, 0, false, true)}" />
		{:else}
			{#if mission.defuser}
				<div class:hspace={mission.nDefuser < 2} style="background-color: {getPersonColor(2, 0, false)}">
					{#if mission.nDefuser > 1}
						×{mission.nDefuser}
					{/if}
				</div>
			{/if}
			{#if mission.expert}
				<div class:hspace={mission.nExpert < 2} style="background-color: {getPersonColor(2, 1, false)}">
					{#if mission.nExpert > 1}
						×{mission.nExpert}
					{/if}
				</div>
			{/if}
			{#if mission.efm}
				<div class:hspace={mission.nEFM < 2} style="background-color: {getPersonColor(1, 0, false)}">
					{#if mission.nEFM > 1}
						×{mission.nEFM}
					{/if}
				</div>
			{/if}
			{#if mission.solo}
				<div class:hspace={mission.nSolo < 2} style="background-color: {getPersonColor(1, 0, true)}">
					{#if mission.nSolo > 1}
						×{mission.nSolo}
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</a>

<style>
	.mission {
		display: flex;
		align-items: center;
		background: var(--foreground);
		color: inherit;
		justify-content: right;
		text-decoration: none;
	}
	.mission-name {
		text-decoration: underline;
		width: 100%;
		padding: var(--gap) 10px;
	}
	.mission > div:not(.mission-name) {
		height: 100%;
		display: flex;
		align-items: center;
	}
	.mission > div > div {
		padding: 0 var(--gap);
		display: flex;
		align-items: center;
		height: 100%;
		color: #000;
	}
	.hspace {
		min-width: 16px;
	}

	.green {
		background-color: #00ff0044;
	}
</style>
