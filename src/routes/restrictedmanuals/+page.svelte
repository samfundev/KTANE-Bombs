<script lang="ts">
	import type { RepoManual } from '$lib/repo.js';

	export let data;
	let manuals: RepoManual[] | null = data.manuals;
</script>

<svelte:head>
	<title>Restricted Manuals</title>
</svelte:head>
<div class="block">
	<h1 class="header">Restricted Manuals</h1>
</div>
<div class="block">
	<p>
		These manuals may <strong><u>not</u></strong> be used for any mission as they are considered too powerful. This list
		is the result of voting and discussion by the sheet maintainers.<br />
		On the <a href="https://ktane.timwi.de/">Manual Repo</a>, there is a checkbox in the Options menu that hides these
		manuals when unchecked.
	</p>
	{#if manuals !== null}
		<table>
			{#each manuals as manual}
				<tr class="manual">
					<td>{manual.Language ?? ''}</td>
					<td>
						{manual.Name}
						{#if manual.TranslatedName}
							<br />({manual.TranslatedName})
						{/if}
					</td>
					<td>
						{#if manual.Descriptor}
							<strong>{manual.Descriptor}</strong><br />
						{/if}
						{manual.Author ?? ''}
					</td>
				</tr>
				<tr><td /><td /><td /></tr>
			{/each}
		</table>
	{/if}
</div>

<style>
	table {
		margin: 0 auto;
		border-spacing: 0;
	}
	td {
		padding: 0.2em 0.6em;
	}
	tr.manual {
		background-color: var(--contrast-block-background);
	}
	p a {
		color: var(--text-color);
	}
</style>
