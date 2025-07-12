<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type Props = {
		value: any;
		label: string;
		options: any[];
		title?: string;
		labelClass?: string;
		display?: any;
		sideLabel?: boolean;
		children?: import('svelte').Snippet;
	} & HTMLSelectAttributes;

	let {
		value = $bindable(),
		label,
		options,
		title = '',
		labelClass = '',
		display = (obj: any) => obj.toString(),
		sideLabel = false,
		children,
		...props
	}: Props = $props();

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLSelectElement }) => {
		let newValue = e.currentTarget.value;
		for (const option of options) {
			if (newValue === display(option)) {
				value = option;
				return;
			}
		}
		props.oninput?.(e);
	};
</script>

<div class={sideLabel ? 'hstack' : 'vstack'}>
	<label for={props.id} {title} class={labelClass}>
		{label}
		{@render children?.()}
	</label>
	<select {...props} oninput={handleInput}>
		{#each options as option}
			<option selected={option === value}>{display(option)}</option>
		{/each}
	</select>
</div>

<style>
	select {
		background-color: var(--textbox-background);
		padding: var(--gap);
		border: none;
		border-radius: 5px;
		color: var(--textbox-text-color);
		width: 100%;
		box-sizing: border-box;
	}
	.hstack {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 3px;
	}
	.vstack {
		display: flex;
		flex-direction: column;
	}
</style>
