<script lang="ts">
	import { Bomb } from '$lib/types';
	import type { Mission } from '$lib/types';
	import { formatTime, getSolveTypes, listify } from '$lib/util';

	export let mission: Mission;
	const solveTypes = getSolveTypes(mission);

	const bombs = mission.bombs;
	const statBomb = new Bomb();
	statBomb.modules = bombs.map((bomb) => bomb.modules).reduce((a, b) => a + b, 0);
	statBomb.time = Math.max(...bombs.map((bomb) => bomb.time));
	statBomb.strikes = Math.max(...bombs.map((bomb) => bomb.strikes));
	statBomb.widgets = Math.max(...bombs.map((bomb) => bomb.widgets));

	const orBlank = (condition: boolean, color: string) => (condition ? color : 'transparent');

	const color = `linear-gradient(${orBlank(
		solveTypes.normalSolve,
		'hsl(210, 100%, 65%)'
	)} 25%, ${orBlank(solveTypes.efmSolve, 'hsl(300, 100%, 75%)')} 25.01% 50%, ${orBlank(
		mission.tpSolve,
		'#9146ff'
	)} 50.01% 75%, ${orBlank(solveTypes.soloSolve, '#00ffff')} 75.01%)`;

	const solvers = [
		solveTypes.normalSolve ? 'by a team' : null,
		solveTypes.efmSolve ? 'via EFM' : null,
		mission.tpSolve ? 'on Twitch Plays' : null,
		solveTypes.soloSolve ? 'solo' : null
	].flatMap((solver) => solver ?? []);
	const title =
		solvers.length === 0
			? "This mission hasn't been solved."
			: `This mission has been solved ${listify(solvers)}.`;
</script>

<div class="mission-name">{mission.name}</div>
<div class="indicator" style:background={color} {title} />
<div class="stats">
	{#if bombs.length > 1}
		{bombs.length} B ·
	{/if}
	{statBomb.modules} {bombs.length > 1 ? "Mods":"Modules"} · {formatTime(statBomb.time)} · {statBomb.strikes}
	Strikes · {statBomb.widgets}
	Widgets
	{#if mission.factory !== null}
		· {mission.factory}
	{/if}
</div>

<style>
	.stats {
		font-style: italic;
		font-size: 85%;
		color: var(--light-text-color);
	}

	.indicator {
		grid-column: 2;
		grid-row: 1 / span 2;
	}
</style>
