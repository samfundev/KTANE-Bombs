<script lang="ts">
	import UserCard from '$lib/cards/UserCard.svelte';
	import { properUrlEncode } from '$lib/util.js';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	let users = $derived(data.users.slice().sort((a, b) => a.username.localeCompare(b.username)));
</script>

<svelte:head>
	<title>Users</title>
</svelte:head>

<h1 class="header">Users</h1>
{#each users as user (user.username)}
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
