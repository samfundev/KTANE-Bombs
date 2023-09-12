<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import type { FrontendUser, MissionPack } from '$lib/types';
	import { getSteamID, validateSteamID } from '$lib/util';
	import toast from 'svelte-french-toast';

	export let user: FrontendUser;

	let pack: MissionPack = {
		name: '',
		steamId: '',
		uploadedBy: user.id,
		dateAdded: new Date()
	};

	let invalid = false;
	let valid = false;
	let inputtedId = '';
	$: {
		pack.steamId = getSteamID(inputtedId);
		valid = !invalid && pack.name.length > 0 && pack.steamId.length > 0;
	}

	function upload() {
		fetch('/upload/missionpack', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(pack)
		})
			.then(response => {
				if (response.ok) {
					toast.success(`Mission pack uploaded successfully!`);
				} else {
					toast.error(`Mission pack failed to upload.`);
				}
			})
			.catch(() => toast.error('An error occurred.'));
	}
</script>

<div class="block flex grow">
	<Input label="Name" id="pack-name" required bind:value={pack.name} />
	<Input
		label="Steam ID / Workshop URL"
		id="pack-steam-id"
		validate={validateSteamID}
		required
		bind:invalid
		bind:value={inputtedId} />
</div>
<div class="block">
	<button on:click={upload} disabled={!valid}>Upload</button>
</div>
