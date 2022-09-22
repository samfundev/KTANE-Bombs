<script lang="ts">
	export let id: string;
	export let name: string;
	export let value: any;
	export let label: string = '';
	export let group: any = '';
	export let sideLabel: boolean = false;
	export let labelAfter: boolean = false;
	export let disabled: boolean = false;
</script>

<div class:hstack={sideLabel}>
	{#if !labelAfter}
		<label for={id}>
			{label}
			<slot />
		</label>
	{/if}
	<input {id} type="radio" bind:group {name} {value} {disabled} on:change/>
	{#if labelAfter}
		<label for={id}>
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
		margin: 2.8px;
	}
	label {
		cursor: pointer;
		user-select: none;
	}
	.hstack {
		gap: 3px;
	}
</style>
