<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let id: string;
	export let value: any;
	export let label: string = '';
	export let placeholder: string = '';
	export let classes: string = '';
	export let labelClass: string = '';
	export let title: string = '';
	export let required: boolean = false;
	export let sideLabel: boolean = false;
	export let autoExpand: boolean = false;
	export let rows: number = 2;
	export let instantFormat: boolean = true;
	export let options: any[] | null = null;
	export let display = (value: any) => value.toString();
	export let parse = (value: string): any => value;
	export let validate = (_value: any): boolean | string => true;

	const dispatch = createEventDispatcher();
	let text_area: HTMLTextAreaElement;
	let displayValue = display(value);
	$: {
		if (instantFormat) displayValue = display(value);
	}

	let error = '';

	const handleInput = (e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
		displayValue = e.currentTarget.value;

		let newValue = parse(e.currentTarget.value);
		if (options !== null) {
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
		if (autoExpand) autoSetHeight();
		dispatch('input');
	};

	function autoSetHeight() {
		text_area.style.height = '0';
		text_area.style.height = text_area.scrollHeight + 3 + 'px';
	}

	function handleValidity(value: any) {
		const validity = validate(value);
		if (required) {
			text_area.setCustomValidity(typeof validity === 'string' ? validity : validity ? '' : 'Invalid value.');
			text_area.reportValidity();
		}

		error = text_area.validationMessage;

		return validity === true || validity === '';
	}

	onMount(() => {
		handleValidity(value);
		text_area.setAttribute('style', 'height:' + text_area.scrollHeight + 'px;overflow-y:hidden;');
		text_area.style.height = '0';
		text_area.style.height = text_area.scrollHeight + 3 + 'px';
		autoSetHeight();
	});
</script>

<div class={sideLabel ? 'hstack' : 'vstack'}>
	<label for={id} {title} class={labelClass}>
		{label}
		<slot />
	</label>
	<textarea
		{id}
		{placeholder}
		{title}
		class={classes}
		class:autoresize={autoExpand}
		{required}
		{rows}
		bind:this={text_area}
		value={displayValue}
		on:input={handleInput}
		on:change={() => {
			if (error === '') {
				displayValue = display(value);
			}
			dispatch('change');
		}}></textarea>
	{#if error}
		<div style="color: rgb(255, 80, 80);">{error}</div>
	{/if}
	{#if options}
		<datalist id={id + '-list'}>
			{#each options as option}
				<option value={display(option)}></option>
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
	textarea.autoresize {
		resize: horizontal;
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
