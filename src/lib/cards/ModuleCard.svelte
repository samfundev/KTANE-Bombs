<script lang="ts">
	import type { RepoModule } from '$lib/repo';
	import { hasSpecialIcon } from '$lib/util';

	export let module: RepoModule;
</script>

<div
	class="module"
	class:boss={module.BossStatus != undefined}
	class:pseudoneedy={module.Quirks?.includes('PseudoNeedy')}
	class:needy={module.Type == 'Needy'}>
	{#if hasSpecialIcon(module.ModuleID)}
		<div class="image {module.ModuleID}" />
	{:else}
		<img
			src="https://ktane.timwi.de/iconsprite"
			alt={module.Name}
			style="object-position: -{module.X * 32}px -{module.Y * 32}px" />
	{/if}
	<span>{module.Name}</span>
</div>

<style>
	.module {
		display: flex;
		align-items: center;
		gap: var(--gap);
		padding: var(--gap);
	}

	:global(.image.ALL_SOLVABLE) { background-image: url('$lib/img/icon/ALL_SOLVABLE.png'); }
	:global(.image.ALL_NEEDY) { background-image: url('$lib/img/icon/ALL_NEEDY.png'); }
	:global(.image.ALL_VANILLA_SOLVABLE) { background-image: url('$lib/img/icon/ALL_VANILLA_SOLVABLE.png'); }
	:global(.image.ALL_VANILLA_NEEDY) { background-image: url('$lib/img/icon/ALL_VANILLA_NEEDY.png'); }
	:global(.image.ALL_MODS_SOLVABLE) { background-image: url('$lib/img/icon/ALL_MODS_SOLVABLE.png'); }
	:global(.image.ALL_MODS_NEEDY) { background-image: url('$lib/img/icon/ALL_MODS_NEEDY.png'); }
	.module > .image,
	.module > img {
		height: 32px;
		width: 32px;
		object-fit: none;
		image-rendering: crisp-edges;
	}
</style>
