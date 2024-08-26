<script lang="ts">
	export let id: string;
	export let checked: any = false;
	export let label: string = '';
	export let sideLabel: boolean = false;
	export let labelAfter: boolean = false;
	export let disabled: boolean = false;
	export let title: string = '';
</script>

<div class:hstack={sideLabel}>
	{#if !labelAfter}
		<label {title} for={id}>
			{label}
			<slot />
		</label>
	{/if}
	<input {id} type="checkbox" bind:checked {disabled} on:change />
	{#if labelAfter}
		<label {title} for={id}>
			{label}
			<slot />
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
	label {
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
