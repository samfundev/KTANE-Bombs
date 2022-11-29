<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import type { MissionPack } from '$lib/types';
	import { isOnlyDigits } from '$lib/util';
	import toast from 'svelte-french-toast';

	let pack: MissionPack = {
		name: '',
		steamId: ''
	};

	let invalid = false;

	$: valid = !invalid && pack.name.length > 0 && pack.steamId.length > 0;

	function validateSteamId(str: string): string | boolean {
		let trimmed = str.trim();
		if (isOnlyDigits(trimmed)) return '';

		let url: URL | null = null;
		try {
			url = new URL(trimmed);
		} catch (e: any) {
			return 'Invalid Steam Workshop URL or Workshop ID.';
		}

		if (url?.hostname !== 'steamcommunity.com') return 'Invalid Steam Workshop URL or Workshop ID.';

		let id = url?.searchParams?.get('id');
		if (id === null) return 'Invalid Steam Workshop URL or Workshop ID.';

		if (isOnlyDigits(id)) return '';

		id = id.substring(0, id.search(/[^0-9]/));
		if (isOnlyDigits(id)) return '';

		return 'Invalid Steam Workshop URL or Workshop ID';
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
		validate={validateSteamId}
		required
		bind:invalid
		bind:value={pack.steamId} />
</div>
<div class="block">
	<button on:click={upload} disabled={!valid}>Upload</button>
</div>
