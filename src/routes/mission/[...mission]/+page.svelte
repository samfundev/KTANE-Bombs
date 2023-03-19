<script lang="ts">
	import { Permission, Pool, type Mission, type MissionPack } from '$lib/types';
	import {
		excludeArticleSort,
		formatTime,
		getModule,
		getPersonColor,
		hasPermission,
		onlyUnique,
		pluralize
	} from '$lib/util';
	import CompletionList from '$lib/comp/CompletionList.svelte';
	import type { RepoModule } from '$lib/repo';
	import { page } from '$app/stores';
	import { sortBombs } from '../_shared';
	import ModuleCard from '$lib/cards/ModuleCard.svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import Select from '$lib/controls/Select.svelte';
	import * as DeMiL from '$lib/demil';
	import toast from 'svelte-french-toast';
	import DeMiLErrorDialog from './_DeMiLErrorDialog.svelte';

	type Variant = Pick<Mission, 'name' | 'completions' | 'tpSolve'>;
	export let data;
	export let mission: Mission & { missionPack: MissionPack; verified: boolean } = data.mission;
	export let variants: Variant[] | null = data.variants;
	export let modules: Record<string, RepoModule> | null = data.modules;

	const viewOptions = ['Pools', 'Probabilities'];
	let byPerc = '';
	const viewTitle =
		'Pools view shows the actual module pools as defined by the mission author.\n' +
		'Probabilities view shows probability that at least one instance of a module will be present on a bomb.';
	const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
	// const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };

	let demilHelpState: 'Error' | 'InvalidVersion' | 'NotInstalled' | 'MissingModules' | 'MissionNotFound' | undefined;
	let missingModules: RepoModule[];
	let demilErrorMessage: string;
	let demilVersion: string | undefined;
	const steamID = mission.missionPack.steamId;

	function poolClass(mods: string[] = [], module: RepoModule | null = null): string {
		let classes = '';
		if (module || mods.length == 1) {
			let mod = module ?? getModule(mods[0], modules);
			if (mod.BossStatus != undefined) classes += ' boss';
			if (mod.Quirks != undefined) classes += ' quirks';
			if (mod.Type == 'Needy') classes += ' needy';
		} else classes += ' border';
		return classes;
	}

	function poolFractions(pool: Pool) {
		let fPool = pool.modules.filter(onlyUnique);
		return fPool.map(mod => {
			return {
				mod,
				frac: pool.modules.filter(m => m === mod).length / pool.modules.length
			};
		});
	}

	function condensedPool(pool: Pool) {
		let fPool = poolFractions(pool);
		if (fPool.length == pool.modules.length && fPool.length > 1) {
			return {
				uniform: true,
				count: pool.count,
				mods: fPool.map(p => {
					return { mod: p.mod, frac: 1 / fPool.length };
				})
			};
		}

		return {
			uniform: false,
			count: pool.count,
			mods: fPool
		};
	}

	let demilClient = new DeMiL.DeMiLClient(8095);
	async function startMission() {
		demilHelpState = undefined;
		try {
			const missionResult = await demilClient.startMissionByName(mission.name, steamID);
			demilVersion = !missionResult.IsVersionInRange ? missionResult.Version ?? '<2.1.0' : undefined;
			if (missionResult.hasOwnProperty('MissingModules')) {
				missingModules = (missionResult as DeMiL.StartMissionMissingModulesResult).MissingModules.map(mod =>
					getModule(mod, modules)
				);
				demilHelpState = 'MissingModules';
			} else if (missionResult.hasOwnProperty('MissionModulesCount')) {
				let moduleCountError = missionResult as DeMiL.StartMissionTooManyModulesResult;
				demilErrorMessage = `Failed to start mission. A bomb that can support more modules is required. Current bombs only support up to ${moduleCountError.MaximumSupportedModulesCount} modules, and the mission has ${moduleCountError.MissionModulesCount} modules.`;
				demilHelpState = 'Error';
			} else if (missionResult.hasOwnProperty('MissionBombsCount')) {
				let bombCountError = missionResult as DeMiL.StartMissionTooManyBombsResult;
				demilErrorMessage = `A room that can support more bombs is required. Current rooms only support up to ${bombCountError.MaximumSupportedBombsCount} bombs, and the mission has ${bombCountError.MissionBombsCount} bombs.`;
				demilHelpState = 'Error';
			} else {
				toast.success(`Started mission ${missionResult.MissionID}`);
			}
		} catch (e) {
			console.error(e);
			if (e instanceof TypeError) {
				demilHelpState = 'NotInstalled';
			} else if (e instanceof DeMiL.DeMiLError && e.message.match(/Mod with steamID \d+ not found/)) {
				demilHelpState = 'MissionNotFound';
			} else if (e instanceof Error) {
				demilHelpState = 'Error';
				demilErrorMessage = 'DeMiL threw an error: ' + e.message;
			}
		}
	}
	sortBombs(mission, modules);

	type BombFrac = {
		mods: { mod: string; frac: number }[];
		pools: { uniform: boolean; count: number; mods: { mod: string; frac: number }[] }[];
	};

	let bombFrac: BombFrac[] = [];
	mission.bombs.forEach(b => {
		let fPools = b.pools.map(p => condensedPool(p));
		let modNames = b.pools
			.flatMap(p => p.modules)
			.filter(onlyUnique)
			.sort(excludeArticleSort);
		let mods: { mod: string; frac: number }[] = [];
		modNames.forEach(m => {
			let prob = 1;
			fPools.forEach(p => {
				let modF = p.mods.find(mod => mod.mod == m);
				if (modF) prob *= Math.pow(1 - modF.frac, p.count);
			});
			mods.push({ mod: m, frac: 1 - prob });
		});
		bombFrac.push({ mods, pools: fPools });
	});

	let wrView = writable(byPerc);
	function storeView() {
		wrView.set(byPerc);
	}
	if (browser) {
		byPerc = JSON.parse(localStorage.getItem('mission-pools-view') || JSON.stringify(viewOptions[0]));
		wrView.subscribe(value => {
			localStorage.setItem('mission-pools-view', JSON.stringify(value));
		});
		storeView();
	}
</script>

<svelte:head>
	<title>{mission.name}</title>
</svelte:head>
<div class="block relative">
	<h1 class="header">{mission.name}</h1>
	<div class="centered">
		by {mission.authors.join(', ')} from
		{#if mission.missionPack}
			<a class="pack" href="/missionpack/{encodeURIComponent(mission.missionPack.name)}">{mission.missionPack.name}</a>
		{:else}
			---
		{/if}

		{#if mission.dateAdded !== null}
			<span class="date">{mission.dateAdded.toLocaleDateString(undefined, dateOptions)}</span>
		{/if}
		{#if mission.logfile !== null}
			<a class="logfile" href={mission.logfile}>Logfile</a>
		{/if}
		<button class="start-mission" on:click={startMission}>Start Mission</button>
	</div>
	{#if hasPermission($page.data.user, Permission.VerifyMission)}
		<a href={$page.url.href + '/edit'} class="top-right">Edit</a>
	{/if}
</div>
{#if !mission.verified}
	<div class="block centered not-verified">This mission has not been verified.</div>
{/if}
{#if mission.factory !== null || mission.designedForTP}
	<div class="block hstack">
		{#if mission.factory !== null}
			<span>Factory: {mission.factory}</span>
		{/if}
		{#if mission.timeMode !== null}
			<span>{mission.timeMode} Time</span>
		{/if}
		{#if mission.strikeMode !== null}
			<span>{mission.strikeMode} Strikes</span>
		{/if}
		{#if mission.designedForTP}
			<span class="designed-for-tp">Designed for TP</span>
		{/if}
	</div>
{/if}
<DeMiLErrorDialog {demilHelpState} {steamID} {missingModules} {demilErrorMessage} {demilVersion} />
<div class="main-content">
	<div class="bombs">
		<div class="block legend-bar flex">
			<div class="legend left flex">
				<span class="boss">Boss/Semi-Boss</span>
				<span class="needy">Needy</span>
				<span class="quirks">Has Other Quirks</span>
			</div>
			<Select
				id="view-select"
				label="View:"
				labelClass="help"
				title={viewTitle}
				sideLabel
				options={viewOptions}
				bind:value={byPerc}
				on:change={storeView} />
		</div>
		{#each mission.bombs as bomb, bIdx}
			<div class="block">
				{pluralize(bomb.modules, 'Module')} · {formatTime(bomb.time)} · {pluralize(bomb.strikes, 'Strike')} · {pluralize(
					bomb.widgets,
					'Widget'
				)}
			</div>
			{#if byPerc == viewOptions[1]}
				<div class="pools column">
					<div class="mod-list">
						{#each bombFrac[bIdx].mods as pool}
							{@const module = getModule(pool.mod, modules)}
							<div class="single {poolClass([], module)}">
								<ModuleCard {module} fraction={pool.frac} alwaysShow />
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="pools">
					{#each bombFrac[bIdx].pools as pool}
						<div class="pool {poolClass(pool.mods.map(p => p.mod))}">
							<div class="modules">
								{#if pool.uniform}
									<div class="all-percent">{Math.floor(pool.mods[0].frac * 1000) / 10}% each:</div>
								{/if}
								{#each pool.mods.map(mod => getModule(mod.mod, modules)) as module, idx}
									<ModuleCard {module} fraction={!pool.uniform ? pool.mods[idx].frac : 1} />
								{/each}
							</div>
							{#if pool.count !== 1}
								<span class="multiplier"> ×{pool.count}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
	<div class="flex column">
		<div class="block legend-bar legend flex">
			<span class="first-solve">First Solve</span>
			<span style="background-color: {getPersonColor(2, 0, false)}; color:#000">Defuser</span>
			<span style="background-color: {getPersonColor(2, 1, false)}; color:#000">Expert</span>
			<span style="background-color: {getPersonColor(1, 0, false)}; color:#000">EFM</span>
			<span style="background-color: {getPersonColor(1, 0, true)}; color:#000">Solo</span>
			<span style="background-color: {getPersonColor(1, 0, false, true)}; color:#FFF">TP</span>
		</div>
		<div class="block header">Solves</div>
		<CompletionList {mission} />
		{#each variants ?? [] as variant}
			<a href="/mission/{encodeURIComponent(variant.name)}" class="block header variant">
				{variant.name}
			</a>
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

	.all-percent {
		line-height: 32px;
		padding: var(--gap);
		font-weight: bold;
		font-size: 120%;
	}

	.hspace {
		width: 100px;
	}
	.hstack {
		display: flex;
		justify-content: center;
		gap: 20px;
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
	a {
		color: var(--text-color);
	}
	a.logfile,
	.date,
	.start-mission {
		margin-left: 20px;
	}
	a.variant {
		margin-top: calc(var(--gap) * 3);
	}

	.pools {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
		align-content: start;
	}
	:global(.pool:not(.quirks) .module.quirks),
	:is(.pool, .single).quirks,
	span.quirks {
		background-color: #00bbff55 !important;
	}
	:global(.pool:not(.boss) .module.boss),
	:is(.pool, .single).boss,
	span.boss {
		background-color: #ff000055 !important;
	}
	:global(.pool:not(.needy) .module.needy),
	:is(.pool, .single).needy,
	span.needy {
		background-color: #0000ff66 !important;
	}
	.pool.border {
		border: 2px dashed var(--textbox-background);
	}
	.multiplier {
		white-space: nowrap;
		font-size: 120%;
	}

	.mod-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		background-color: var(--foreground);
		flex-grow: 1;
	}

	span.first-solve {
		background-color: hsl(43, 74%, 70%);
		color: black;
	}

	.legend-bar {
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.legend {
		flex-wrap: wrap;
		justify-content: center;
	}
	.legend.left {
		width: 80%;
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
		gap: calc(var(--gap) * 2);
	}

	.header {
		font-weight: bold;
		text-align: center;
	}

	.top-right {
		position: absolute;
		color: var(--text-color);
		top: var(--gap);
		right: var(--gap);
	}
</style>
