<script lang="ts">
	import { Bomb } from '$lib/types';
	import type { Mission } from '$lib/types';
	import { formatTime, getSolveTypes, listify, pluralize } from '$lib/util';

	export let mission: Mission;

	const bombs = mission.bombs;
	const statBomb = new Bomb();
	statBomb.modules = bombs.map(bomb => bomb.modules).reduce((a, b) => a + b, 0);
	statBomb.time = Math.max(...bombs.map(bomb => bomb.time));
	statBomb.strikes = Math.max(...bombs.map(bomb => bomb.strikes));
	statBomb.widgets = Math.max(...bombs.map(bomb => bomb.widgets));
</script>

<div class="mission-name">{mission.name}</div>
<div class="stats">
	{#if bombs.length > 1}
		{bombs.length} B ·
	{/if}
	{pluralize(statBomb.modules, bombs.length > 1 ? 'Mod' : 'Module')} · {formatTime(statBomb.time)} ·
	{pluralize(statBomb.strikes, 'Strike')} · {pluralize(statBomb.widgets, 'Widget')}
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
</style>
