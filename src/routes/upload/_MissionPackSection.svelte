<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import type { MissionPack } from '$lib/types';
	import { isOnlyDigits, requiredField } from '$lib/util';
	import toast from 'svelte-french-toast';

	let pack: MissionPack = {
		name: '',
		steamId: ''
	};

	let steamIdText: string = '';
	$: valid = pack.name.length > 0 && pack.steamId.length > 0;

	function validSteamID(str: string): string | boolean {
		pack.steamId = '';
		let trimmed = str.trim();
		if (isOnlyDigits(trimmed)) {
			pack.steamId = trimmed;
			return true;
		}
		if (trimmed.length < 1) return requiredField();

		let url: URL | null = null;
		try {
			url = new URL(trimmed);
		} catch (e: any) {
			return 'Invalid URL';
		}

		if (url?.hostname !== 'steamcommunity.com') return 'steamcommunity.com URL';

		let id = url?.searchParams?.get('id');
		if (id === null) return 'ID is required in URL';

		id = id.substring(0, id.search(/[^0-9]|$/));
		if (isOnlyDigits(id)) {
			pack.steamId = id;
			return true;
		}

		return 'Invalid Workshop URL';
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
	<Input label="Steam ID / Workshop URL" id="pack-steam-id" required validate={validSteamID} bind:value={steamIdText} />
</div>
<div class="block">
	<button on:click={upload} disabled={!valid}>Upload</button>
</div>
