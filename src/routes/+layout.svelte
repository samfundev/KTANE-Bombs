<script lang="ts">
	import '../app.css';
	import { Permission } from '$lib/types.svelte.js';
	import type { FrontendUser } from '$lib/types.svelte.js';
	import UserCard from '$lib/cards/UserCard.svelte';
	import { hasAnyPermission, properUrlEncode } from '$lib/util';
	import { Toaster } from 'svelte-french-toast';
	import { beforeNavigate } from '$app/navigation';
	import { popup } from '$lib/util';
	import { disappearAll } from '$lib/util';
	import { onMount } from 'svelte';
	import HomeInfoMenu from '$lib/home/HomeInfoMenu.svelte';
	import { navigating } from '$app/state';

	let { data, children } = $props();
	const user: FrontendUser | null = data.user;

	let infoMenu = $state() as HTMLDivElement;
	let infoTab = $state() as HTMLDivElement;
	beforeNavigate(({ from, to, cancel }) => {
		// If we're navigating to the same route, use browser navigation instead
		// This saves us from having to make our pages reactive to the data variable
		if (to !== null && from?.route.id === to.route.id) {
			cancel();
			location.href = to.url.href;
		}
	});
	onMount(() => {
		document.onclick = disappearAll;
		return () => {
			document.onclick = null;
		};
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
				<a class="block" href="/verify">Verify</a>
			{/if}
		{/if}
		<div style="margin-left: auto" class="block info-tab" bind:this={infoTab}>
			<button class="reset" onclick={() => popup(infoMenu, infoTab, true, [8, 6])}>Info</button>
			<HomeInfoMenu bind:div={infoMenu} />
		</div>

		{#if user}
			<div>
				<a href="/user/{properUrlEncode(user.username)}">
					<UserCard {user} />
				</a>
			</div>
			<a class="block" rel="external" href="/logout">Logout</a>
		{:else}
			<a class="block" rel="external" href="/login">Login</a>
		{/if}
	</div>
	<div class="loader" class:visible={navigating.complete !== null}></div>
</div>
<div class="flex column max-width padding">
	{@render children?.()}
</div>

<Toaster
	toastOptions={{
		style: 'background: var(--background); color: var(--text-color);',
		duration: 5000,
		position: 'top-center'
	}} />

<style>
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
	.info-tab {
		cursor: pointer;
	}

	.max-width {
		width: var(--page-content-width);
		margin: 0 auto;
	}

	.loader {
		position: absolute;
		top: 0;
		z-index: 2;
		height: 0;
		width: 100vw;
		--c: no-repeat linear-gradient(color-mix(in oklab, black 20%, var(--accent)) 0 0);
		background: var(--c), var(--c), color-mix(in oklab, white, var(--accent));
		background-size: 60% 100%;
		animation: l16 3s infinite;
		transition: height 0.25s 0.25s;
	}
	@keyframes l16 {
		0% {
			background-position:
				-150% 0,
				-150% 0;
		}
		66% {
			background-position:
				250% 0,
				-150% 0;
		}
		100% {
			background-position:
				250% 0,
				250% 0;
		}
	}

	.loader.visible {
		height: 3px;
	}
</style>
