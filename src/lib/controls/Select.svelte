<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let id: string;
	export let value: any;
	export let label: string;
	export let options: any[];
	export let display = (obj: any) => obj.toString();
	export let sideLabel: boolean = false;

	const dispatch = createEventDispatcher();

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLSelectElement }) => {
		let newValue = e.currentTarget.value;
		for (const option of options) {
			if (newValue === display(option)) {
				value = option;
				return;
			}
		}
		dispatch('input');
	};
</script>

<div class={sideLabel ? 'hstack' : 'vstack'}>
	<label for={id}>
		{label}
		<slot />
	</label>
	<select {id} on:change on:input={handleInput}>
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
