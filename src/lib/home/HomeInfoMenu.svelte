<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	type Props = {
		div?: HTMLDivElement | null;
	} & SvelteHTMLElements['div'];

	let { div = $bindable(), ...props }: Props = $props();
</script>

<div {...props} class="popup disappear disappear-stat0 hidden" id="about-menu" bind:this={div}>
	<div class="flex column">
		<a href="/rules">Rules</a>
		<a href="/restrictedmanuals">Restricted Manuals</a>
		<a href="/seasoninfo">Seasons</a>
		<a href="/modules">Modules</a>
		<a href="https://github.com/samfundev/KTANE-Bombs/issues">GitHub</a>
		<a href="/changelog">What’s New?</a>
	</div>
</div>

<style>
	.popup a {
		color: var(--text-color);
	}
</style>
