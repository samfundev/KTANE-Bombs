<script lang="ts">
	import type { FrontendUser } from '$lib/types';
	import UserCard from '$lib/cards/UserCard.svelte';
	import { properUrlEncode } from '$lib/util.js';
	let { data } = $props();
	let users: FrontendUser[] = data.users;

	// Sort users
	users.sort((a, b) => a.username.localeCompare(b.username));
</script>

<svelte:head>
	<title>Users</title>
</svelte:head>

<h1 class="header">Users</h1>
{#each users as user}
	<a href="/user/{properUrlEncode(user.username)}">
		<UserCard {user} />
	</a>
{/each}

<style>
	a {
		text-decoration: none;
		color: var(--text-color);
	}
</style>
