<script lang="ts">
	import Input from '$lib/controls/Input.svelte';

	import { getSteamID, validateSteamID } from '$lib/util';
	import equal from 'fast-deep-equal';
	import { applyAction } from '$app/forms';
	import type { EditMissionPack } from '../../_types';
	import MissionCard from '$lib/cards/MissionCard.svelte';

	export let data;

	let pack: EditMissionPack = data.pack;

	let originalPack: EditMissionPack;

	function setOriginalMission() {
		originalPack = JSON.parse(JSON.stringify(pack));
	}

	setOriginalMission();

	$: modified = !equal(pack, originalPack);

	async function saveChanges() {
		const fData = new FormData();
		fData.append('pack', JSON.stringify(pack));

		const response = await fetch('?/editMissionPack', {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}

	async function deleteMissionPack() {
		if (!confirm('Delete Mission Pack. This cannot be undone. Are you sure?')) return;
		const fData = new FormData();
		fData.append('pack', JSON.stringify(originalPack));

		const response = await fetch('?/deleteMissionPack', {
			method: 'POST',
			body: fData
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}
</script>

<svelte:head>
	<title>{pack.name}</title>
</svelte:head>
<div class="block flex column relative">
	<Input label="Name" id="pack-name" required bind:value={pack.name} />
	<Input
		label="Steam ID / Workshop URL"
		id="pack-steam-id"
		parse={getSteamID}
		validate={validateSteamID}
		required
		instantFormat={false}
		forceValidate
		bind:value={pack.steamId} />
	<div class="actions">
		<button on:click={deleteMissionPack}>Delete</button>
	</div>
</div>
<div class="main-content">
	<div />
	<div class="missions">
		{#each pack.missions as mission}
			<MissionCard {mission} />
		{/each}
	</div>
</div>
<div class="bottom-center flex" class:visible={modified}>
	<div class="save-changes block flex">
		There are unsaved changes.
		<button on:click={saveChanges}>Save</button>
	</div>
</div>

<style>
	.main-content {
		display: grid;
		grid-template-columns: 1fr 3fr 1fr;
		gap: var(--gap);
	}

	@media (max-width: 600px) {
		.main-content {
			display: flex;
			flex-direction: column;
		}
	}

	.missions {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}

	.bottom-center {
		position: fixed;
		bottom: var(--gap);
		justify-content: center;
		margin: var(--gap);
		width: calc((min(100vw, 1150px) - 4 * var(--gap)));

		transform: translateY(100%);
		pointer-events: none;
		opacity: 0;
		transition: transform 0.4s, opacity 0.4s;
		transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
	}

	.bottom-center.visible {
		transform: none;
		opacity: 1;
	}

	.save-changes {
		pointer-events: auto;
		justify-content: center;
		align-items: center;
		box-shadow: var(--foreground) 0 0 10px;
		color: #ddd;
		background-color: rgb(15, 15, 15);
	}
</style>
