<script lang="ts">
	import CompletionSection from './_CompletionSection.svelte';
	import MissionPackSection from './_MissionPackSection.svelte';
	import MissionSection from './_MissionSection.svelte';
	import type { FrontendUser, MissionPackSelection } from '$lib/types';
	export let data;

	let missionInfo: { [name: string]: number } = data.missionInfo;
	let authorNames: string[] = data.authorNames;
	let solverNames: string[] = data.solverNames;
	let packs: MissionPackSelection[] = data.packs;

	let section: 'solve' | 'mission' | 'missionpack' = 'solve';
</script>

<svelte:head>
	<title>Upload</title>
</svelte:head>

<h1 class="header">Upload</h1>
<div class="section-selector flex grow">
	<div class="block" class:selected={section == 'solve'} on:click={() => (section = 'solve')}>Solve</div>
	<div class="block" class:selected={section == 'mission'} on:click={() => (section = 'mission')}>Mission</div>
	<div class="block" class:selected={section == 'missionpack'} on:click={() => (section = 'missionpack')}>
		Mission Pack
	</div>
</div>
{#if section == 'mission'}
	<MissionSection {missionInfo} {authorNames} {packs} />
{:else if section == 'missionpack'}
	<MissionPackSection />
{:else}
	<CompletionSection {missionInfo} {solverNames} />
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
