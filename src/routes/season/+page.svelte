<script lang="ts">
	import { TP_TEAM } from '$lib/const';
	import { type Completer, Permission } from '$lib/types';
	import { properUrlEncode, hasPermission } from '$lib/util.js';
	import { onMount } from 'svelte';
    import { page } from '$app/stores';
	export let data;
	const seasons: Array<{ id: number, seasonName: string }> = data.seasons || [];
    const currentSeason = data.currentSeason;
    const seasonCompleters: Record<string, Completer[]> = data.seasonCompleters || {};
	let ranks: { [name: string]: number } = {};
	let rank = 1;
	let tied = 1;
	let selectedSeasonName: string = currentSeason?.seasonName || '';
    let completers: Completer[] = seasonCompleters[selectedSeasonName] || [];
    let seasonName: string = '';
    let showSuccessPopup: boolean = false;
    let successMessage: string = '';
    let seasonsList: Array<{ id: number, seasonName: string }> = [];
    let selectedSeasonId: number | null = null;
    let showDeletePopup: boolean = false;
    let seasonToDelete: string = '';

    $: {
        completers = seasonCompleters[selectedSeasonName] || [];

        if (completers.length > 0) {
            recalculateRanks(completers);
        }
    }

    function handleSeasonChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        selectedSeasonName = target.value;
    }

    function recalculateRanks(completersArray: Completer[]): void {
        ranks = {};
        rank = 1;
        tied = 1;

        if (completersArray.length > 0) {
            ranks[completersArray[0].name] = rank;
            for (let c = 1; c < completersArray.length; c++) {
                const comp = completersArray[c];
                const prev = completersArray[c - 1];
                if (
                    comp.distinct === prev.distinct &&
                    comp.defuser + comp.expert + comp.efm === prev.defuser + prev.expert + prev.efm
                ) {
                    tied++; // Tied with previous
                } else {
                    rank += tied; // New rank
                    tied = 1;
                }
                ranks[comp.name] = rank;
            }
        }
    }

    async function addSeason() {
        if (!seasonName.trim()) return;

        try {
            const response = await fetch('/season/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seasonName: seasonName.trim() })
            });

            if(response.ok){
                successMessage = `Season "${seasonName.trim()}" added successfully!`;
                showSuccessPopup = true;
                await loadSeasons();
            }

            seasonName = '';
        } catch (error) {
          console.error('Error adding season:', error);
        }
    }

    function closePopup(): void {
        showSuccessPopup = false;
    }

    async function loadSeasons(): Promise<void> {
        try {
            const response = await fetch('/season/get');
            if (response.ok) {
                seasonsList = await response.json();
            }
        } catch (error) {
            console.error('Error loading seasons:', error);
        }
    }

    async function deleteSelectedSeason(): Promise<void> {
        if (!selectedSeasonId) return;
        closeDeletePopup();
        try {
            const response = await fetch(`/season/delete/${selectedSeasonId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadSeasons();
                selectedSeasonId = null;
            }
        } catch (error) {
            console.error('Error deleting season:', error);
        }
    }

    function confirmDelete(): void {
        if (!selectedSeasonId) return;

        const season = seasonsList.find(s => s.id === selectedSeasonId);
        if (season) {
            seasonToDelete = season.seasonName;
            showDeletePopup = true;
        }
    }

    function closeDeletePopup(): void {
        showDeletePopup = false;
    }

    onMount(async () => {
        if (completers.length > 0) {
            recalculateRanks(completers);
        }
        await loadSeasons();
    });
</script>

<svelte:head>
	<title>Season</title>
</svelte:head>
<h1 class="header">
	Season
	<div class="season-selector">
        <select
            id="season-select"
            bind:value={selectedSeasonName}
            on:change={handleSeasonChange}
        >
            {#each seasons as season}
                <option value={season.seasonName} selected={season.seasonName === currentSeason?.seasonName}>
                    {season.seasonName}
                </option>
            {:else}
                <option value="" disabled>No seasons available</option>
            {/each}
        </select>


    {#if hasPermission($page.data.user, Permission.ManageSeasons)}
        <div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
            <input
              type="text"
              bind:value={seasonName}
              placeholder="Start new season"
              on:keypress={(e) => e.key === 'Enter' && addSeason()}
              style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px;"
            />
            <button
              on:click={addSeason}
              disabled={!seasonName.trim()}
              style="padding: 1px 2px; font-size: 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Add
            </button>
        </div>
    {/if}

    {#if showSuccessPopup}
        <div class="popup-overlay" on:click={closePopup}>
            <div class="popup" on:click|stopPropagation>
                <div class="popup-content">
                    <p>{successMessage}</p>
                </div>
                <div class="popup-footer">
                    <button on:click={closePopup} class="btn-ok">OK</button>
                </div>
            </div>
        </div>
    {/if}

    <br>

    {#if hasPermission($page.data.user, Permission.ManageSeasons)}
        <div style="display: flex; gap: 10px; align-items: center;">
            <select
                bind:value={selectedSeasonId}
                style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; min-width: 200px;"
            >
                <option value={null} disabled selected>Select season to delete</option>
                {#each seasonsList as season}
                    <option value={season.id}>{season.seasonName}</option>
                {/each}
            </select>
            <button
                on:click={confirmDelete}
                disabled={!selectedSeasonId}
                style="padding: 1px 2px; font-size: 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
                Delete
            </button>
        </div>
    {/if}

    {#if showDeletePopup}
    <div class="popup-overlay" on:click={closeDeletePopup}>
        <div class="popup" on:click|stopPropagation>
            <div class="popup-content">
                <p>Are you sure you want to delete season <strong>"{seasonToDelete}"</strong>?</p>
                <p class="warning-text">This action cannot be undone!</p>
            </div>
            <div class="popup-footer">
                <button on:click={closeDeletePopup} class="btn-cancel" style="background: #6c757d; margin-right: 10px;">Cancel</button>
                <button on:click={deleteSelectedSeason} class="btn-confirm" style="background: #dc3545;">Delete</button>
            </div>
        </div>
    </div>
    {/if}

    </div>
</h1>

<div class="table">
	<b class="block" />
	<b class="block">Name</b>
	<b class="block" title="Number of distinct missions solved.">Distinct</b>
	<b class="block" title="Number of missions solved (including duplicates).">Total</b>
	<b class="block">Defuser</b>
	<b class="block">Expert</b>
	<b class="block">EFM</b>
	{#each completers as completer}
		<div class="block">{ranks[completer.name]}</div>
		<div class="block"><a href="/user/{properUrlEncode(completer.name)}">{completer.name}</a></div>
		<div class="block">{completer.distinct}</div>
		<div class="block">{completer.defuser + completer.expert + completer.efm}</div>
		<div class="block">{completer.defuser}</div>
		<div class="block">{completer.expert}</div>
		<div class="block">{completer.efm}</div>
	{/each}
</div>

<style>
	.table {
		display: grid;
		grid-template-columns: min-content min-content auto auto auto auto auto;
		gap: var(--gap);
		text-align: center;
	}
	.header {
		position: relative;
	}
	.header a {
		position: absolute;
		font-size: 12pt;
		line-height: 2.2;
		color: #9146ff;
		left: 10px;
	}

	.table b.block {
		position: sticky;
		top: var(--stick-under-navbar);
	}
	.table .block {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	a {
		color: var(--text-color);
	}
</style>
