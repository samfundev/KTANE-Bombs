<script lang="ts">
	import { Permission, Pool, type Mission, type MissionPack } from '$lib/types';
	import { formatTime, getModule, getPersonColor, hasPermission, pluralize } from '$lib/util';
	import CompletionList from '$lib/comp/CompletionList.svelte';
	import type { RepoModule } from '$lib/repo';
	import { page } from '$app/stores';
	import { sortBombs } from '../_shared';
	import ModuleCard from '$lib/cards/ModuleCard.svelte';

	type Variant = Pick<Mission, 'name' | 'completions' | 'tpSolve'>;
	export let data;
	export let mission: Mission & { missionPack: MissionPack; verified: boolean } = data.mission;
	export let variants: Variant[] | null = data.variants;
	export let modules: Record<string, RepoModule> | null = data.modules;

	function poolClass(pool: Pool): string {
		let classes = 'pool';
		if (pool.modules.length == 1) {
			let mod = getModule(pool.modules[0], modules);
			if (mod.BossStatus != undefined) classes += ' boss';
			if (mod.Quirks != undefined) classes += ' quirks';
			if (mod.Type == 'Needy') classes += ' needy';
		}
		return classes;
	}

	sortBombs(mission, modules);
</script>

<svelte:head>
	<title>{mission.name}</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">{mission.name}</h1>
	<div class="centered">
		by {mission.authors.join(', ')}
		from
		<a href="https://steamcommunity.com/sharedfiles/filedetails/?id={mission.missionPack.steamId}">
			{mission.missionPack.name}
		</a>
	</div>
	{#if hasPermission($page.data.user, Permission.VerifyMission)}
		<a href={$page.url.href + '/edit'} class="top-right">Edit</a>
	{/if}
</div>
{#if !mission.verified}
	<div class="block centered not-verified">This mission has not been verified.</div>
{/if}
{#if mission.factory !== null}
	<div class="block centered">Factory: {mission.factory}</div>
{/if}
<div class="main-content">
	<div class="bombs">
		<div class="block legend flex">
			<span class="boss">Boss/Semi-Boss</span>
			<span class="needy">Needy</span>
			<span class="quirks">Has Other Quirks</span>
		</div>
		{#each mission.bombs as bomb}
			<div class="block">
				{pluralize(bomb.modules, 'Module')} · {formatTime(bomb.time)} · {pluralize(bomb.strikes, 'Strike')} · {pluralize(
					bomb.widgets,
					'Widget'
				)}
				{#if mission.designedForTP}
					· <span class="designed-for-tp">Designed for TP</span>
				{/if}
			</div>
			<div class="pools">
				{#each bomb.pools as pool}
					<div class={poolClass(pool)}>
						<div class="modules">
							{#each pool.modules.map(module => getModule(module, modules)) as module}
								<ModuleCard {module} />
							{/each}
						</div>
						{#if pool.count !== 1}
							<span style="white-space: nowrap"> ×{pool.count}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<div class="flex column">
		<div class="block legend flex">
			<span class="first-solve">First Solve</span>
			<span style="background-color: {getPersonColor(2, 0, false)}; color:#000">Defuser</span>
			<span style="background-color: {getPersonColor(2, 1, false)}; color:#000">Expert</span>
			<span style="background-color: {getPersonColor(1, 0, false)}; color:#000">EFM</span>
			<span style="background-color: {getPersonColor(1, 0, true)}; color:#000">Solo</span>
		</div>
		<div class="block header">Solves</div>
		<CompletionList {mission} />
		{#each variants ?? [] as variant}
			<div class="block header" style="margin-top: calc(var(--gap) * 3);">
				{variant.name}
			</div>
			<CompletionList mission={variant} />
		{/each}
	</div>
</div>

<style>
	.main-content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: auto 1fr;
		gap: var(--gap);
	}

	@media (max-width: 500px) {
		.main-content {
			display: flex;
			flex-direction: column;
		}
	}

	.hspace {
		width: 100px;
	}

	.bombs {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}

	.designed-for-tp {
		color: #9146ff;
	}
	.not-verified {
		color: red;
	}
	.centered {
		text-align: center;
	}

	.pools {
		display: flex;
		flex-wrap: wrap;
		/*
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
		*/
		gap: var(--gap);
		align-content: start;
	}
	:global(.pool:not(.quirks) .module.quirks),
	.pool.quirks,
	span.quirks {
		background-color: #00bbff55 !important;
	}
	:global(.pool:not(.boss) .module.boss),
	.pool.boss,
	span.boss {
		background-color: #ff000055 !important;
	}
	:global(.pool:not(.needy) .module.needy),
	.pool.needy,
	span.needy {
		background-color: #0000ff66 !important;
	}
	span.first-solve {
		background-color: hsl(43, 74%, 70%);
		color: black;
	}

	.legend {
		justify-content: center;
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.legend > span {
		padding: var(--gap);
	}

	.pool {
		/* padding: var(--gap); */
		flex-grow: 1;
		background: var(--foreground);

		display: flex;
		gap: var(--gap);
		align-items: center;
	}

	.pool > span {
		padding: var(--gap) var(--gap) var(--gap) 0;
	}
	.pool > div {
		flex-grow: 1;
	}

	.modules {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gap) * 3);
	}

	.header {
		font-weight: bold;
		text-align: center;
	}

	.top-right {
		position: absolute;
		top: var(--gap);
		right: var(--gap);
	}
</style>
