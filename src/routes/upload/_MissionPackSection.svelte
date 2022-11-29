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
	let valid = false;
	let inputtedId = '';
	$: {
		pack.steamId = getSteamID(inputtedId);
		valid = !invalid && pack.name.length > 0 && pack.steamId.length > 0;
	}

	function getSteamID(str: string): string {
		let trimmed = str.trim();
		if (isOnlyDigits(trimmed)) return trimmed;

		let url: URL | null = null;
		try {
			url = new URL(trimmed);
		} catch (e: any) {
			return '';
		}

		if (url?.hostname !== 'steamcommunity.com') return '';

		let id = url?.searchParams?.get('id');
		if (id === null) return '';

		if (isOnlyDigits(id)) return id;

		id = id.substring(0, id.search(/[^0-9]/));
		if (isOnlyDigits(id)) return id;

		return '';
	}

	function validateSteamID(str: string): string | boolean {
		let id = getSteamID(str);
		if (id === '') {
			return 'Invalid Steam Workshop URL or Workshop ID.';
		}
		return '';
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
