<script lang="ts">
	import { browser } from '$app/environment';
	import type { FrontendUser } from '$lib/types.svelte';
	import { checkIfImageExists } from '$lib/util';

	interface Props {
		user: FrontendUser;
	}

	let { user }: Props = $props();

	let imageExists = $state(false);
	let alternate = Math.max(0, parseInt(user.id.slice(-2)) % 5);

	if (user.avatar.length > 1 && browser)
		checkIfImageExists(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`, exists => {
			imageExists = exists;
		});
</script>

<div class="block user">
	{#if user.avatar.length != 1 && imageExists}
		<img class="avatar" src="https://cdn.discordapp.com/avatars/{user.id}/{user.avatar}.webp?size=32" alt="Avatar" />
	{:else}
		<img
			class="avatar"
			src="https://cdn.discordapp.com/embed/avatars/{user.avatar.length == 1 ? user.avatar : alternate}.png?size=32"
			alt="Avatar" />
	{/if}
	<div class:username={user.discordName?.length > 0}>{user.username}</div>
	{#if user.discordName?.length > 0}
		<div class="discord">Discord: {user.discordName}</div>
	{/if}
</div>

<style>
	.user {
		display: flex;
		flex-direction: row;
		gap: var(--gap);
		align-items: center;
	}
	.username {
		min-width: 350px;
	}
	.discord {
		margin-left: 10px;
	}

	.avatar {
		border-radius: 50%;
		height: 20px;
	}
</style>
