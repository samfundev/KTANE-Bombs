<script lang="ts" context="module">

	import client from '$lib/client';
	import type { RequestHandlerOutput } from '@sveltejs/kit';
	let unverifiedMissions = 0;
	let unverifiedPacks = 0;
	let unverifiedCompletions = 0;
	async function RunVerify(): Promise<RequestHandlerOutput> {
		unverifiedCompletions = await client.completion.count({
			where: {
				verified: false
			}
		});
	  unverifiedMissions = await client.mission.count({
			where: {
				verified: false
			}
		});
		unverifiedPacks = await client.missionPack.count({
			where: {
				verified: false
			}
		});
	}
	RunVerify();
</script>
<script lang="ts">
	import { session } from '$app/stores';
	import { Permission } from '$lib/types';
	import type { FrontendUser } from '$lib/types';
	import UserCard from '$lib/UserCard.svelte';
	import { hasPermission, hasAnyPermission } from '$lib/util';
	import { onMount } from 'svelte';
	import { toasts, ToastContainer, FlatToast } from 'svelte-toasts';
	
	const user: FrontendUser | null = $session.user;

	onMount(() => {
		const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

		toasts.setDefaults({
			theme: darkQuery.matches ? 'dark' : 'light',
			placement: 'top-center',
			duration: 5000
		});
		darkQuery.addEventListener('change', (event) => {
			toasts.setDefaults({
				theme: event.matches ? 'dark' : 'light'
			});
		});
	});
</script>

<div class="navbar-background">
	<div class="navbar max-width">
		<a class="block" href="/">Home</a>
		<a class="block" href="/solvers">Solvers</a>
		<a class="block" href="/upload">Upload</a>
		<a class="block" href="/users">Users</a>
		{#if user}
			{#if hasAnyPermission(user, Permission.VerifyMission, Permission.VerifyCompletion, Permission.VerifyMissionPack)}
					{#await RunVerify()}
					<a class="block" href="/verify">Verify {((hasPermission(user, Permission.VerifyMission) ? unverifiedMissions : 0) + (hasPermission(user, Permission.VerifyCompletion) ? unverifiedCompletions : 0) + (hasPermission(user, Permission.VerifyMissionPack) ? unverifiedPacks : 0))}</a>
					{/await}
					
			{/if}

			<div style="margin-left: auto;">
				<a href="/user/{user.username}">
					<UserCard {user} />
				</a>
			</div>
			<a class="block" rel="external" href="/logout">Logout</a>
		{:else}
			<a class="block" style="margin-left: auto;" rel="external" href="/login">Login</a>
		{/if}
	</div>
</div>
<div class="flex column max-width padding">
	<slot />
</div>

<ToastContainer let:data>
	<FlatToast {data} />
</ToastContainer>

<style>
	:root {
		--gap: 5px;
		--background: lightgray;
		--foreground: white;
		--text-color: black;
		--light-text-color: rgb(100, 100, 100);
		--link-text-color: currentColor;
		--link-visited-text-color: currentColor;
		--accent: #bc421e;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background: rgb(50, 50, 50);
			--foreground: rgb(30, 30, 30);
			--text-color: white;
			--light-text-color: rgb(150, 150, 150);
			--link-text-color: rgb(200, 200, 200);
			--link-visited-text-color: rgb(130, 130, 130);
		}
	}

	:global(body) {
		margin: 0;
		font-family: sans-serif;
		color: var(--text-color);
		background: var(--background);
	}

	:global(a:link) {
		color: var(--link-text-color);
	}

	:global(a:visited) {
		color: var(--link-visited-text-color);
	}

	:global(button) {
		background-color: var(--accent);
		color: white;
		padding: 2px 13px;
		border: 1px solid hsl(14, 72%, 33%);
		border-radius: 5px;
		font-size: inherit;
	}

	:global(button:hover) {
		background-color: hsl(14, 72%, 38%);
	}

	:global(button:active) {
		background-color: hsl(14, 72%, 33%);
	}

	:global(button:disabled) {
		opacity: 0.5;
	}

	:global(form) {
		display: contents;
	}

	:global(.foreground) {
		background-color: var(--foreground);
	}

	:global(.padding) {
		padding: var(--gap);
	}

	:global(.margin) {
		margin: var(--gap);
	}

	:global(.block) {
		background-color: var(--foreground);
		padding: var(--gap);
	}

	:global(.flex) {
		display: flex;
		gap: var(--gap);
	}

	:global(.flex.column) {
		flex-direction: column;
	}

	:global(.flex.content-width) {
		align-items: flex-start;
	}

	:global(.flex.grow > *) {
		flex: 1;
	}

	:global(h1.header) {
		background: var(--foreground);
		text-align: center;
		padding: var(--gap);
		font-size: 200%;
		margin: 0;
	}

	:global(.relative) {
		position: relative;
	}

	:global(.actions) {
		position: absolute;
		top: calc(-1 * var(--gap));
		right: calc(-1.5 * var(--gap));
		display: none;
	}

	:global(*:hover > .actions) {
		display: initial;
	}

	:global(.st-toast.light) {
		background: white !important;
	}

	.navbar-background {
		background: var(--accent);
		outline: var(--accent) 2px dashed;
		margin-bottom: 2px;

		position: sticky;
		top: 0;
		z-index: 1;
	}

	.navbar {
		display: flex;
		padding: var(--gap);
		gap: var(--gap);
		font-size: 125%;
		white-space: nowrap;
	}

	.navbar a {
		color: var(--text-color);
		text-decoration: none;
	}

	.max-width {
		width: min(calc(100vw - 2 * var(--gap)), 1150px);
		margin: 0 auto;
	}
</style>
