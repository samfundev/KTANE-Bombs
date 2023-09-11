<script lang="ts">
	export let div: HTMLDivElement | null = null;
</script>

<div class="popup disappear disappear-stat0 hidden" id="about-menu" on:click bind:this={div}>
	<div class="flex column">
		<a href="/rules">Rules</a>
		<a href="/restrictedmanuals">Restricted Manuals</a>
		<a href="https://github.com/samfundev/KTANE-Bombs/issues">GitHub</a>
		<a href="/changelog">What’s New?</a>
	</div>
</div>

<style>
	.popup a {
		color: var(--text-color);
	}
</style>
