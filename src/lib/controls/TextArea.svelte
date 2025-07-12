<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = {
		value: any;
		label?: string;
		labelClass?: string;
		sideLabel?: boolean;
		autoExpand?: boolean;
		instantFormat?: boolean;
		options?: any[] | null;
		display?: any;
		parse?: any;
		validate?: any;
		children?: import('svelte').Snippet;
	} & HTMLTextareaAttributes;

	let {
		value = $bindable(),
		label = '',
		class: classes = '',
		labelClass = '',
		sideLabel = false,
		autoExpand = false,
		instantFormat = true,
		options = null,
		display = (value: any) => value.toString(),
		parse = (value: string): any => value,
		validate = (_value: any): boolean | string => true,
		children,
		...props
	}: Props = $props();

	let text_area = $state() as HTMLTextAreaElement;
	let displayValue = $state(display(value));
	$effect(() => {
		if (instantFormat) displayValue = display(value);
	});

	let error = $state('');

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
		props.oninput?.(e);
	};

	function autoSetHeight() {
		text_area.style.height = '0';
		text_area.style.height = text_area.scrollHeight + 3 + 'px';
	}

	function handleValidity(value: any) {
		const validity = validate(value);
		if (props.required) {
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
	<label for={props.id} title={props.title} class={labelClass}>
		{label}
		{@render children?.()}
	</label>
	<textarea
		class={classes}
		class:autoresize={autoExpand}
		bind:this={text_area}
		value={displayValue}
		{...props}
		oninput={handleInput}
		onchange={e => {
			if (error === '') {
				displayValue = display(value);
			}
			props.onchange?.(e);
		}}></textarea>
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
