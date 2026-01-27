<script lang="ts">
	import Input from '$lib/controls/Input.svelte';

	import { formatDate, getSteamID, parseDate, validateSteamID } from '$lib/util';
	import equal from 'fast-deep-equal';
	import { applyAction } from '$app/forms';
	import type { EditMissionPack } from '../../_types';
	import MissionCard from '$lib/cards/MissionCard.svelte';

	let { data } = $props();

	let pack: EditMissionPack = $state(data.pack);

	let originalPack: EditMissionPack = $state();

	function setOriginalMission() {
		originalPack = JSON.parse(JSON.stringify(pack));
		originalPack.dateAdded = pack.dateAdded;
	}

	setOriginalMission();

	let modified = $derived(JSON.stringify(pack) !== JSON.stringify(originalPack));

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
	<div class="flex">
		<Input
			type="date"
			id="pack-date"
			label="Date Added"
			class="light"
			parse={parseDate}
			display={formatDate}
			bind:value={pack.dateAdded} />
	</div>
	<div class="actions">
		<button onclick={deleteMissionPack}>Delete</button>
	</div>
</div>
<div class="main-content mission-card-grid">
	{#each pack.missions as mission}
		<MissionCard {mission} />
	{/each}
</div>
<div class="bottom-center flex" class:visible={modified}>
	<div class="save-changes block flex">
		There are unsaved changes.
		<button onclick={saveChanges}>Save</button>
	</div>
</div>

<style>
	.main-content {
		display: grid;
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
		transition:
			transform 0.4s,
			opacity 0.4s;
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
