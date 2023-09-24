<script lang="ts">
	import type { FrontendUser } from '$lib/types';
	import UserCard from '$lib/cards/UserCard.svelte';
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { applyAction } from '$app/forms';

	export let data;
	let users: FrontendUser[] = data.users;

	// Sort users
	let newUsername = '';
	let oldUsername = '';
	let dialog: HTMLDialogElement;

	async function editName() {
		const fData = new FormData();
		fData.append('oldUsername', JSON.stringify(oldUsername));
		fData.append('newUsername', JSON.stringify(newUsername));

		const response = await fetch('?/renameOnly', {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}

	function showRename(username: string) {
		newUsername = oldUsername = username;
		dialog.showModal();
	}

	users.sort((a, b) => a.username.localeCompare(b.username));
</script>

<svelte:head>
	<title>User Rename</title>
</svelte:head>

<h1 class="header">User Rename</h1>
<div class="block">
	This page is for separating a user account from their solver name without changing any missions or solves.<br />
	Do this only when you need to fix a user who has a username matching a solver or author that is not actually them.
</div>
{#each users as user}
	<div class="relative">
		<UserCard {user} />
		<div class="actions">
			<button on:click={() => showRename(user.username)}>Rename Only</button>
		</div>
	</div>
{/each}
<Dialog bind:dialog>
	<div class="flex column content-width">
		<h2>Rename Only</h2>
		<form on:submit|preventDefault={() => editName()}>
			<Input
				id="username"
				label="Username"
				bind:value={newUsername}
				required
				validate={value => (value === oldUsername ? 'Please enter the new username.' : true)} />
			<button type="submit">Submit</button>
		</form>
	</div>
</Dialog>

<style>
	h2 {
		margin: 0;
	}
	.actions {
		top: 0;
		right: 0;
	}
</style>
