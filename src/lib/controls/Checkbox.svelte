<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		checked?: boolean;
		label?: string;
		sideLabel?: boolean;
		labelAfter?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
	} & HTMLInputAttributes;

	let {
		checked = $bindable(false),
		label = '',
		sideLabel = false,
		labelAfter = false,
		class: classes = '',
		children,
		...props
	}: Props = $props();
</script>

<div class:hstack={sideLabel}>
	{#if !labelAfter}
		<label class={classes} title={props.title} for={props.id}>
			{label}
			{@render children?.()}
		</label>
	{/if}
	<input class={classes} type="checkbox" bind:checked {...props} />
	{#if labelAfter}
		<label class={classes} title={props.title} for={props.id}>
			{label}
			{@render children?.()}
		</label>
	{/if}
</div>

<style>
	input {
		display: block;
		padding: var(--gap);
		border: none;
		box-sizing: border-box;
	}
	label:not(.help) {
		cursor: pointer;
		user-select: none;
	}
	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2px;
	}
</style>
