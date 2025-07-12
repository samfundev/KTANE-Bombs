<script lang="ts">
	import Input from '$lib/controls/Input.svelte';
	import { applyAction } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { result: oauthResult, takenUsernames, firstTime } = data;
	let username = $state(data.username);

	function trimName(str: string): any {
		return str.trim();
	}

	function nameTaken(name: string): boolean {
		return takenUsernames.some(un => {
			return un.toLowerCase() === name.toLowerCase();
		});
	}

	function unameVal(val: any): boolean | string {
		return nameTaken(val)
			? 'Name is taken'
			: val.length > 50
				? '50 characters max'
				: /\S/.test(val)
					? true
					: 'Cannot be blank';
	}

	async function submit() {
		if (nameTaken(username) || !/\S/.test(username)) return;
		const fData = new FormData();
		fData.append('username', JSON.stringify(username));
		fData.append('result', JSON.stringify(oauthResult));

		const response = await fetch('?/selectUsername', {
			method: 'POST',
			body: fData
		});
		const resp: ActionResult = await response.json();

		if (resp.type === 'redirect') {
			location.href = resp.location;
		} else {
			applyAction(resp);
		}
	}
</script>

<svelte:head>
	{#if firstTime}
		<title>Choose Username</title>
	{:else}
		<title>Username Conflict</title>
	{/if}
</svelte:head>

<h1 class="header">
	{#if firstTime}
		Choose Username for Solves
	{:else}
		Username Conflict
	{/if}
</h1>
<div class="block flex column content-width">
	<div>
		{#if firstTime}
			Choose a username as you want it to appear on the list of bomb solves.<br />
			The name you choose now can only be changed by asking an admin, and <b>will</b> be changed for you if your chosen name
			is inappropriate.
		{:else}
			Someone already has that username, please select another.
		{/if}
	</div>
	<form
		onsubmit={e => {
			e.preventDefault();
			submit();
		}}
		method="POST">
		<Input
			name="username"
			id="username"
			label="Username"
			required
			bind:value={username}
			parse={trimName}
			validate={unameVal} />
		<button type="submit">Submit</button>
	</form>
</div>
