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
	export let autoExpand: boolean = false;
	export let rows: number = 2;
	export let options: any[] | null = null;
	export let display = (value: any) => value.toString();
	export let parse = (value: string): any => value;
	export let validate = (_value: any): boolean | string => true;

	const dispatch = createEventDispatcher();
	let text_area: HTMLTextAreaElement;
	$: displayValue = display(value);

	let error = '';

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
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
		if (autoExpand) {
			text_area.style.height = "";
			text_area.style.height = (text_area.scrollHeight + 3) + "px";
		}
		dispatch('input');
	};

	function handleValidity(value: any) {
		const validity = validate(value);
		text_area.setCustomValidity(
			typeof validity === 'string' ? validity : validity ? '' : 'Invalid value.'
		);
		text_area.reportValidity();

		error = text_area.validationMessage;

		return validity === true || validity === '';
	}

	onMount(() => handleValidity(value));
</script>

<div class:hstack={sideLabel}>
	<label for={id} {title}>
		{label}
		<slot />
	</label>
	<textarea
		{id}
		{type}
		{placeholder}
		class={classes}
		{required}
		{rows}
		bind:this={text_area}
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
	textarea {
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
