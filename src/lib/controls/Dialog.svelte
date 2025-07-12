<script lang="ts">
	interface Props {
		dialog?: HTMLDialogElement | undefined;
		children?: import('svelte').Snippet;
	}

	let { dialog = $bindable(undefined), children }: Props = $props();

	function onClick(event: Event) {
		if (event.target === dialog) {
			dialog.close();
		}
	}
</script>

<dialog bind:this={dialog} onclick={onClick}>
	<div>
		{@render children?.()}
	</div>
</dialog>

<style>
	dialog {
		background-color: var(--background);
		border: none;
		color: inherit;
		padding: 0;
	}

	div {
		padding: calc(var(--gap) * 3);
	}

	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
