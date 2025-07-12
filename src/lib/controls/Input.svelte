<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		value: any;
		label?: string;
		class?: string;
		labelClass?: string;
		title?: string;
		sideLabel?: boolean;
		instantFormat?: boolean;
		options?: any[] | null;
		optionalOptions?: boolean;
		display?: any;
		parse?: any;
		validate?: any;
		invalid?: boolean;
		forceValidate?: boolean;
		children?: import('svelte').Snippet;
		oninput?: () => void;
	} & HTMLInputAttributes;

	let {
		value = $bindable(),
		label = '',
		class: classes = '',
		labelClass = '',
		title = '',
		sideLabel = false,
		instantFormat = true,
		options = $bindable(null),
		optionalOptions = false,
		display = (value: any) => value.toString(),
		parse = (value: string): any => value,
		validate = (_value: any): boolean | string => true,
		invalid = $bindable(false),
		forceValidate = false,
		children,
		oninput = () => {},
		...props
	}: Props = $props();

	let input = $state() as HTMLInputElement;
	let displayValue = $state(display(value));
	$effect(() => {
		if (instantFormat) displayValue = display(value);
	});

	let error = $state('');
	export const setValue = (val: any) => {
		value = val;
		displayValue = display(value);
		doHandleInput(displayValue);
	};

	function doHandleInput(val: any) {
		let newValue = parse(val);
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
		oninput();
	}
	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		displayValue = e.currentTarget.value;
		doHandleInput(displayValue);
	};

	function handleValidity(value: any, showErrors: boolean = true): boolean {
		const validity = validate(value);
		if (props.required || forceValidate) {
			input.setCustomValidity(typeof validity === 'string' ? validity : validity ? '' : 'Invalid value');
		}

		if (showErrors) error = input.validationMessage;

		invalid = !(validity === true || validity === '');
		return !invalid;
	}

	onMount(() => handleValidity(value, false));
</script>

<div class={sideLabel ? 'hstack' : 'vstack'}>
	<label for={props.id} {title} class={labelClass}>
		{label}
		{@render children?.()}
	</label>
	<input
		{...props}
		class={classes}
		bind:this={input}
		list={props.id + '-list'}
		value={displayValue}
		oninput={handleInput}
		onchange={e => {
			if (error === '') {
				displayValue = display(value);
			}
			props.onchange?.(e);
		}} />
	{#if error}
		<div style="color: rgb(255, 80, 80);">{error}</div>
	{/if}
	{#if options}
		<datalist id={props.id + '-list'}>
			{#each options as option}
				<option value={display(option)}></option>
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
	input:disabled {
		background-color: #888;
	}

	input[type='date'] {
		background-color: lightgray;
		color: black;
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
