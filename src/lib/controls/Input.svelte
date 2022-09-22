<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let id: string;
	export let value: any;
	export let label: string = '';
	export let type: string = 'text';
	export let placeholder: string = '';
	export let classes: string = '';
	export let title: string = '';
	export let required: boolean = false;
	export let sideLabel: boolean = false;
	export let options: any[] | null = null;
	export let display = (value: any) => value.toString();
	export let parse = (value: string): any => value;
	export let validate = (_value: any): boolean | string => true;

	const dispatch = createEventDispatcher();
	let input: HTMLInputElement;
	$: displayValue = display(value);

	let error = '';

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		displayValue = e.currentTarget.value;

		let newValue = parse(e.currentTarget.value);
		if (options !== null) {
			for (const option of options) {
				if (newValue === display(option)) {
					value = option;
					return;
				}
			}

			newValue = null;
		}

		if (handleValidity(newValue)) value = newValue;
		dispatch('input');
	};

	function handleValidity(value: any) {
		const validity = validate(value);
		input.setCustomValidity(
			typeof validity === 'string' ? validity : validity ? '' : 'Invalid value.'
		);
		input.reportValidity();

		error = input.validationMessage;

		return validity === true || validity === '';
	}

	onMount(() => handleValidity(value));
</script>

<div class:hstack={sideLabel}>
	<label for={id} {title}>
		{label}
		<slot />
	</label>
	<input
		{id}
		{type}
		{placeholder}
		class={classes}
		{required}
		bind:this={input}
		list={id + '-list'}
		value={displayValue}
		on:input={handleInput}
		on:change={() => {
			if (error === '') {
				displayValue = display(value);
			}
			dispatch('change');
		}}
	/>
	{#if error}
		<div style="color: rgb(255, 80, 80);">{error}</div>
	{/if}
	{#if options}
		<datalist id={id + '-list'}>
			{#each options as option}
				<option value={display(option)} />
			{/each}
		</datalist>
	{/if}
</div>

<style>
	input {
		background-color: var(--textbox-background);
		padding: var(--gap);
		border: none;
		border-radius: 5px;
		color: var(--textbox-text-color);
		width: 100%;
		box-sizing: border-box;
	}
	.hstack {
		gap: 3px;
	}
	label {
		user-select: none;
	}
</style>
