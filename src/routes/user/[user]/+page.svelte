<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { Completion, Mission, Permission, type FrontendUser } from '$lib/types';
	import { getPersonColor, hasPermission } from '$lib/util';
	import UserPermissions from '../_UserPermissions.svelte';
	import { page } from '$app/stores';
	export let data;
	let username: string = data.username;
	let shownUser: FrontendUser | null = data.shownUser;
	let completions: (Pick<Completion, 'team' | 'solo'> & { mission: { name: string } })[] = data.completions;

	let newUsername = username;
	const oldUsername = username;

	let dialog: HTMLDialogElement;

	async function editName() {
		const response = await fetch('/user/rename', {
			method: 'POST',
			body: JSON.stringify({
				oldUsername,
				username: newUsername,
				userExists: shownUser !== null
			})
		});

		if (response.ok) {
			location.href = `/user/${newUsername}`;
			return;
		}

		alert('Failed to edit name.');
	}

	// Sort completions
	completions.sort((a, b) => a.mission.name.localeCompare(b.mission.name));
</script>

<svelte:head>
	<title>{username}</title>
</svelte:head>

<h1 class="header">{username}</h1>
<div class="block legend flex">
	<span style="background-color: {getPersonColor(2, 0, false)}; color:#000">Defuser</span>
	<span style="background-color: {getPersonColor(2, 1, false)}; color:#000">Expert</span>
	<span style="background-color: {getPersonColor(1, 0, false)}; color:#000">EFM</span>
	<span style="background-color: {getPersonColor(1, 0, true)}; color:#000">Solo</span>
</div>
<div class="block flex column content-width">
	<h2>Solves</h2>
	<div class="solves flex grow">
		{#each completions as completion}
			<a href="/mission/{encodeURIComponent(completion.mission.name)}">
				<div
					class="block"
					style:background-color={getPersonColor(
						completion.team.length,
						completion.team.indexOf(username),
						completion.solo
					)}>
					{completion.mission.name}
				</div>
			</a>
		{/each}
	</div>
	{#if hasPermission($page.data.user, Permission.RenameUser)}
		<button on:click={() => dialog.showModal()}>Edit Name</button>
	{/if}
	<Dialog bind:dialog>
		<div class="flex column content-width">
			<h2>Edit Name</h2>
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
</div>
{#if shownUser !== null && $page.data.user !== null && hasPermission($page.data.user, Permission.ModifyPermissions)}
	<UserPermissions {shownUser} />
{/if}

<style>
	h2 {
		margin: 0;
	}

	.legend {
		justify-content: center;
	}
	.legend > span {
		padding: var(--gap);
	}

	.solves {
		flex-wrap: wrap;
		white-space: nowrap;
	}

	.solves a {
		color: black;
	}
</style>
