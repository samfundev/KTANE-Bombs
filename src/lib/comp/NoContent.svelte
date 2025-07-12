<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="block">
	{@render children?.()}
</div>

<style>
	div {
		text-align: center;
		font-style: italic;
		padding: calc(var(--gap) * 3);
	}
</style>
