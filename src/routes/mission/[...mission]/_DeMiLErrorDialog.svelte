<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import type { RepoModule } from '$lib/repo';

	export let demilHelpState:
		| 'Error'
		| 'InvalidVersion'
		| 'NotInstalled'
		| 'MissingModules'
		| 'MissionNotFound'
		| undefined;
	export let steamID: string;
	export let missingModules: RepoModule[];
	export let demilErrorMessage: string;
	export let demilVersion: string | undefined;

	let dialog: HTMLDialogElement;

	$: {
		if (dialog !== undefined) {
			if (demilHelpState !== undefined) {
				dialog.showModal();
			} else {
				dialog.close();
			}
		}
	}
</script>

<Dialog bind:dialog>
	{#if typeof demilHelpState !== 'undefined'}
		<div class="block">
			{#if demilHelpState === 'NotInstalled'}
				<div>
					You need to install <a
						href="https://steamcommunity.com/sharedfiles/filedetails/?id=2930718104"
						target="_blank"
						rel="noopener noreferrer">DeMiL</a> to start a mission from this webpage and run the game.
				</div>
			{/if}
			{#if demilHelpState === 'MissionNotFound'}
				<div>
					Mission pack is not installed. Download mission pack from <a
						href="https://steamcommunity.com/sharedfiles/filedetails/?id={steamID}"
						target="_blank"
						rel="noopener noreferrer">Steam page</a
					>.
				</div>
			{/if}
			{#if demilHelpState === 'MissingModules'}
				<div>Failed to start mission. Missing modules (click to open steam page):</div>
				<div class="missing-modules">
					{#each missingModules as mod}
						<div>
							{#if mod.SteamID !== null}
								<a
									href="https://steamcommunity.com/sharedfiles/filedetails/?id={mod.SteamID}"
									target="_blank"
									rel="noopener noreferrer">{mod.Name}</a>
							{:else}
								{mod.Name}
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			{#if demilHelpState === 'Error'}
				<div>{demilErrorMessage}</div>
			{/if}
			{#if typeof demilVersion === 'string'}
				<div>
					Your <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=2930718104">DeMiL</a> looks outdated.
					(Version: {demilVersion}) Please try
					<a href="https://help.steampowered.com/en/faqs/view/0C48-FCBD-DA71-93EB">verifying integrity of game files</a
					>. If it still doesn't work, please contact t-chen#5876 in KTaNE discord server.
				</div>
			{/if}
		</div>
	{/if}
</Dialog>

<style>
	.missing-modules {
		display: flex;
		flex-wrap: wrap;
	}
	.missing-modules > div {
		margin-right: 32px;
	}
</style>
