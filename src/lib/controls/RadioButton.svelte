<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		label?: string;
		group?: any;
		sideLabel?: boolean;
		labelAfter?: boolean;
		children?: import('svelte').Snippet;
	} & HTMLInputAttributes;

	let {
		label = '',
		group = $bindable(''),
		sideLabel = false,
		labelAfter = false,
		children,
		...props
	}: Props = $props();
</script>

<div class:hstack={sideLabel}>
	{#if !labelAfter}
		<label for={props.id}>
			{label}
			{@render children?.()}
		</label>
	{/if}
	<input {...props} type="radio" bind:group />
	{#if labelAfter}
		<label for={props.id}>
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
		margin: 2.8px;
	}
	label {
		cursor: pointer;
		user-select: none;
	}
	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 3px;
	}
</style>
