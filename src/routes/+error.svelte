<script lang="ts">
	import { page } from '$app/stores';
	interface Props {
		status?: number;
		error?: App.Error | null;
		path?: string;
	}

	let { status = $page.status, error = $page.error, path = $bindable($page.url?.pathname) }: Props = $props();

	const user: { username: string } | null = $page.data.user;

	// https://stackoverflow.com/a/7616484/8213163
	function hashCode(value: string) {
		var hash = 0,
			i,
			chr;
		if (value.length === 0) return hash;
		for (i = 0; i < value.length; i++) {
			chr = value.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}

	path = decodeURIComponent(path);
	const message =
		status >= 500
			? `Looks like ${path} ran into a problem while loading the page, automatically solving page.`
			: `@${user?.username ?? 'User'}, that command for ${path} (${
					Math.abs(hashCode(path)) % 100
			  }) is invalid.`;
</script>

<div class="block" style="padding: var(--big-gap);">
	<h1 style="margin-top: 0;">{status}</h1>
	<div>{error?.message}</div>
</div>
<div class="block" style="padding: var(--big-gap);">
	<i>{message}</i>
</div>

<style>
	:global(#svelte) {
		display: grid;
		grid-template-rows: auto 1fr;
	}

	* {
		--big-gap: calc(var(--gap) * 3);
	}
</style>
