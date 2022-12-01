<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let name: string = '';
	export let id: string;
	export let value: any;
	export let label: string = '';
	export let type: string = 'text';
	export let placeholder: string = '';
	export let classes: string = '';
	export let labelClass: string = '';
	export let title: string = '';
	export let required: boolean = false;
	export let sideLabel: boolean = false;
	export let instantFormat: boolean = true;
	export let options: any[] | null = null;
	export let optionalOptions: boolean = false;
	export let display = (value: any) => value.toString();
	export let parse = (value: string): any => value;
	export let validate = (_value: any): boolean | string => true;
	export let invalid: boolean = false;

	const dispatch = createEventDispatcher();
	let input: HTMLInputElement;
	let displayValue = display(value);
	$: {
		if (instantFormat) displayValue = display(value);
	}

	let error = '';

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		displayValue = e.currentTarget.value;
		let newValue = parse(e.currentTarget.value);
		if (options !== null && !optionalOptions) {
			let match = false;
			for (const option of options) {
				if (newValue === display(option)) {
					newValue = option;
					match = true;
					break;
				}
			}

			if (!match) newValue = null;
		}

		if (handleValidity(newValue)) value = newValue;
		dispatch('input');
	};

	function handleValidity(value: any, showErrors: boolean = true): boolean {
		const validity = validate(value);
		if (required || validity !== null) {
			input.setCustomValidity(typeof validity === 'string' ? validity : validity ? '' : 'Invalid value');
		}

		if (showErrors) error = input.validationMessage;

		invalid = !(validity === true || validity === '');
		return !invalid;
	}

	onMount(() => handleValidity(value, false));
</script>

<div class={sideLabel ? 'hstack' : 'vstack'}>
	<label for={id} {title} class={labelClass}>
		{label}
		<slot />
	</label>
	<input
		{name}
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
		}} />
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
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 3px;
	}
	.vstack {
		display: flex;
		flex-direction: column;
	}
	label {
		user-select: none;
		margin-right: 2px;
	}
</style>
