<script lang="ts">
	import { Bomb } from '$lib/types.svelte';
	import type { Mission } from '$lib/types.svelte';
	import { formatTime, pluralize } from '$lib/util';

	interface Props {
		mission: Mission;
	}

	let { mission }: Props = $props();

	const bombs = mission.bombs;
	const statBomb = $state(new Bomb());
	statBomb.modules = bombs.map(bomb => bomb.modules).reduce((a, b) => a + b, 0);
	statBomb.widgets = Math.max(...bombs.map(bomb => bomb.widgets));
</script>

<div class="mission-name">{mission.name}</div>
<div class="stats">
	{#if bombs.length > 1}
		{bombs.length} Bombs ·
	{/if}
	{pluralize(statBomb.modules, bombs.length > 1 ? 'Mod' : 'Module')} ·
	{#if mission.timeMode === 'Global'}
		{formatTime(Math.max(...bombs.map(bomb => bomb.time)))} ·
	{:else}
		{formatTime(bombs.map(bomb => bomb.time).reduce((a, b) => a + b, 0))} ·
	{/if}
	{#if mission.strikeMode === 'Global'}
		<span>{pluralize(Math.max(...bombs.map(bomb => bomb.strikes)), 'Strike')}</span> ·
	{:else}
		<span
			>{pluralize(
				bombs.map(bomb => bomb.strikes).reduce((a, b) => a + b, 0),
				'Strike'
			)}</span> ·
	{/if}
	<span>{pluralize(statBomb.widgets, 'Widget')}</span>
	{#if mission.factory !== null}
		· {mission.factory}
		{#if mission.timeMode == 'Global'}
			+ GTime
		{/if}
		{#if mission.strikeMode == 'Global'}
			+ GStrk
		{/if}
	{/if}
</div>

<style>
	.stats {
		font-style: italic;
		font-size: 85%;
		color: var(--light-text-color);
	}
	.stats > span {
		white-space: nowrap;
	}
</style>
