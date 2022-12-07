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
		<div
			class:hidden={!mission.defuser}
			class:hspace={mission.nDefuser < 2}
			style="background-color: {getPersonColor(2, 0, false)}">
			<span class:hidden={mission.nDefuser < 2}>×{mission.nDefuser}</span>
		</div>
		<div
			class:hidden={!mission.expert}
			class:hspace={mission.nExpert < 2}
			style="background-color: {getPersonColor(2, 1, false)}">
			<span class:hidden={mission.nExpert < 2}>×{mission.nExpert}</span>
		</div>
		<div
			class:hidden={!mission.efm}
			class:hspace={mission.nEFM < 2}
			style="background-color: {getPersonColor(1, 0, false)}">
			<span class:hidden={mission.nEFM < 2}>×{mission.nEFM}</span>
		</div>
		<div
			class:hidden={!mission.solo}
			class:hspace={mission.nEFM < 2}
			style="background-color: {getPersonColor(1, 0, true)}">
			<span class:hidden={mission.nSolo < 2}>×{mission.nSolo}</span>
		</div>
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

	.mission div.hidden,
	.mission span.hidden {
		display: none;
	}

	.green {
		background-color: #00ff0044;
	}
</style>
