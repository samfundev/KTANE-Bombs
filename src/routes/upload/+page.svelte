<script lang="ts">
	import CompletionSection from './_CompletionSection.svelte';
	import MissionPackSection from './_MissionPackSection.svelte';
	import MissionSection from './_MissionSection.svelte';
	import type { FrontendUser, MissionPackSelection } from '$lib/types';
	let { data } = $props();

	let missionInfo: { [name: string]: number } = data.missionInfo;
	let authorNames: string[] = data.authorNames;
	let solverNames: string[] = data.solverNames;
	let packs: MissionPackSelection[] = data.packs;
	let currentSeasonId : number | null = data.currentSeasonId;

	let section: 'solve' | 'mission' | 'missionpack' = $state('solve');
</script>

<svelte:head>
	<title>Upload</title>
</svelte:head>

<h1 class="header">Upload</h1>
<div class="section-selector flex grow">
	<button class="block reset" class:selected={section == 'solve'} onclick={() => (section = 'solve')}>Solve</button>
	<button class="block reset" class:selected={section == 'mission'} onclick={() => (section = 'mission')}
		>Mission</button>
	<button class="block reset" class:selected={section == 'missionpack'} onclick={() => (section = 'missionpack')}>
		Mission Pack
	</button>
</div>
{#if section == 'mission'}
	<MissionSection {missionInfo} {authorNames} {packs} />
{:else if section == 'missionpack'}
	<MissionPackSection />
{:else}
	<CompletionSection {missionInfo} {solverNames} {currentSeasonId} />
{/if}

<style>
	.section-selector > * {
		box-sizing: border-box;
		text-align: center;
		padding-bottom: calc(var(--gap) - 3px);
		border-bottom: 3px solid var(--foreground);
		transition: border-bottom-color 0.25s;
	}

	.block {
		cursor: pointer;
	}

	.selected {
		border-bottom-color: var(--accent);
	}
</style>
