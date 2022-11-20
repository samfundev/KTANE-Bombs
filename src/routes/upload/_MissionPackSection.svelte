<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import type { MissionPack } from '$lib/types';
	import { isOnlyDigits } from '$lib/util';
	import toast from 'svelte-french-toast';

	let pack: MissionPack = {
		name: '',
		steamId: ''
	};

	$: valid = pack.name.length > 0 && pack.steamId.length > 0;

	function parseSteamId(str: string): string | null {
		let trimmed = str.trim();
		if (isOnlyDigits(trimmed)) return trimmed;
		else {
			let url: URL | null = null;
			try {
				url = new URL(trimmed);
			} catch (e: any) {
				return null;
			}
			if (url?.hostname !== 'steamcommunity.com') return null;
			let id = url?.searchParams?.get('id');
			if (id === null) return null;
			console.log();
			if (isOnlyDigits(id)) return id;
			else {
				let numbers = id.substring(0, id.search(/[^0-9]/));
				if (isOnlyDigits(numbers)) return numbers;
			}
		}
		return null;
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
		label="Steam ID"
		id="pack-steam-id"
		parse={parseSteamId}
		validate={value => value != null}
		instantFormat={false}
		bind:value={pack.steamId} />
</div>
<div class="block">
	<button on:click={upload} disabled={!valid}>Upload</button>
</div>
