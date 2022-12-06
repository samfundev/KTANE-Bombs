<script lang="ts">
	import Dialog from '$lib/controls/Dialog.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { Completion, IndividualCompletion, Mission, Permission, type FrontendUser } from '$lib/types';
	import { getPersonColor, hasPermission } from '$lib/util';
	import UserPermissions from '../_UserPermissions.svelte';
	import { page } from '$app/stores';
	import MissionCompletionCard from '$lib/cards/MissionCompletionCard.svelte';
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

	let missions: { [name: string]: IndividualCompletion } = {};
	// Sort completions
	completions.sort((a, b) => a.mission.name.localeCompare(b.mission.name));
	completions.forEach(c => {
		let name = c.mission.name;
		if (!(name in missions)) {
			missions[name] = new IndividualCompletion();
			missions[name].name = name;
		}
		if (c.team.length === 1) {
			if (c.solo) {
				missions[name].solo = true;
				missions[name].nSolo += 1;
			} else {
				missions[name].efm = true;
				missions[name].nEFM += 1;
			}
		} else {
			if (c.team.indexOf(username) == 0) {
				missions[name].defuser = true;
				missions[name].nDefuser += 1;
			} else {
				missions[name].expert = true;
				missions[name].nExpert += 1;
			}
		}
	});
</script>

<svelte:head>
	<title>{username}</title>
</svelte:head>

<h1 class="header">{username}</h1>
<div class="block legend flex">
	<span class="green" style="background-color: #00ff005A">Def & Exp & EFM</span>
	<span style="background-color: {getPersonColor(2, 0, false)}">Defuser</span>
	<span style="background-color: {getPersonColor(2, 1, false)}">Expert</span>
	<span style="background-color: {getPersonColor(1, 0, false)}">EFM</span>
	<span style="background-color: {getPersonColor(1, 0, true)}">Solo</span>
</div>
<div class="block"><h2>Solves</h2></div>
<div class="solves flex grow">
	{#each Object.entries(missions) as [_, mission]}
		<MissionCompletionCard {mission} />
	{/each}
</div>
{#if hasPermission($page.data.user, Permission.RenameUser)}
	<div class="block flex column content-width">
		<button on:click={() => dialog.showModal()}>Edit Name</button>
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
{/if}
{#if shownUser !== null && $page.data.user !== null && hasPermission($page.data.user, Permission.ModifyPermissions)}
	<UserPermissions {shownUser} />
{/if}

<style>
	h2 {
		margin: 0;
	}

	.legend {
		justify-content: center;
		color: #000;
	}
	.legend > span {
		padding: var(--gap);
	}

	.solves {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
		align-content: start;
		white-space: nowrap;
	}
	.legend .green {
		color: var(--text-color);
	}
</style>
