<script lang="ts">
	import { Permission } from '$lib/types';
	import type { FrontendUser } from '$lib/types';
	import UserCard from '$lib/cards/UserCard.svelte';
	import { hasAnyPermission } from '$lib/util';
	import { Toaster } from 'svelte-french-toast';
	import { beforeNavigate } from '$app/navigation';
	import { popup, preventDisappear } from '$lib/util';
	import { browser } from '$app/environment';
	import { disappearAll } from '$lib/util';
	import { onMount } from 'svelte';
	import HomeInfoMenu from '$lib/home/HomeInfoMenu.svelte';

	export let data;
	const user: FrontendUser | null = data.user;

	let infoMenu: HTMLDivElement;
	let infoTab: HTMLDivElement;
	beforeNavigate(({ from, to, cancel }) => {
		// If we're navigating to the same route, use browser navigation instead
		// This saves us from having to make our pages reactive to the data variable
		if (to !== null && from?.routeId === to.routeId) {
			cancel();
			location.href = to.url.href;
		}
	});
	onMount(() => {
		document.onclick = () => disappearAll();
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
		<div
			style="margin-left: auto"
			class="block info-tab"
			bind:this={infoTab}
			on:click={() => popup(infoMenu, infoTab, true, [8, 6])}>
			Info
			<HomeInfoMenu bind:div={infoMenu} on:click={() => preventDisappear(infoMenu)} />
		</div>

		{#if user}
			<div>
				<a href="/user/{encodeURIComponent(user.username)}">
					<UserCard {user} />
				</a>
			</div>
			<a class="block" rel="external" href="/logout">Logout</a>
		{:else}
			<a class="block" rel="external" href="/login">Login</a>
		{/if}
	</div>
</div>
<div class="flex column max-width padding">
	<slot />
</div>

<Toaster
	toastOptions={{
		style: 'background: var(--background); color: var(--text-color);',
		duration: 5000,
		position: 'top-center'
	}} />

<style>
	:root {
		--gap: 5px;
		--background: lightgray;
		--foreground: white;
		--text-color: black;
		--textbox-text-color: white;
		--textbox-background: rgb(15, 15, 15);
		--popup-background: #fafaff;
		--light-text-color: rgb(100, 100, 100);
		--link-text-color: currentColor;
		--link-visited-text-color: currentColor;
		--blue-link-color: blue;
		--blue-link-visited-color: rgb(156, 34, 232);
		--accent: #bc421e;
		--stick-under-navbar: calc(1.25em + 4 * var(--gap) + 2px);
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background: rgb(50, 50, 50);
			--foreground: rgb(30, 30, 30);
			--text-color: white;
			--textbox-text-color: black;
			--textbox-background: lightgray;
			--popup-background: rgb(50, 50, 50);
			--light-text-color: rgb(150, 150, 150);
			--link-text-color: rgb(200, 200, 200);
			--link-visited-text-color: rgb(130, 130, 130);
			--blue-link-color: rgb(85, 167, 255);
			--blue-link-visited-color: rgb(174, 93, 240);
		}
		:global(.dark-invert) {
			filter: invert(90%);
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

	:global(.popup) {
		display: block;
		position: absolute;
		border: 1px solid black;
		padding: 1em;
		background: var(--popup-background);
		color: var(--text-color);
		box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	:global(.popup-tab) {
		font-size: 12pt;
		font-weight: normal;
		display: inline-block;
		background-color: #eef;
		border: 1px solid #eef;
		border-bottom: none;
		border-top-color: #ccf;
		border-right-color: #ccf;
		border-right-width: 2px;
		border-top-left-radius: 0.5em;
		border-top-right-radius: 0.5em;
		text-decoration: none;
		color: #024;
		cursor: pointer;
		padding: 0.2em 0.5em 0.115em 28px;
		position: relative;
		top: 5px;
		margin-left: 0.2em;
		vertical-align: bottom;
		background-size: 20px 20px;
		background-position: 4px center;
		background-repeat: no-repeat;
		align-self: flex-end;
	}

	:global(.hidden) {
		display: none !important;
	}

	:global(label.help) {
		cursor: help;
	}

	:global(.mission-card-grid) {
		grid-template-columns: 1fr 1fr 1fr;
	}
	@media screen and (max-width: 875px) {
		:global(.mission-card-grid) {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media screen and (max-width: 650px) {
		:global(.mission-card-grid) {
			grid-template-columns: 1fr;
		}
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
	.info-tab {
		cursor: pointer;
	}

	.max-width {
		width: min(calc(100vw - 4 * var(--gap)), 1150px);
		margin: 0 auto;
	}
</style>
