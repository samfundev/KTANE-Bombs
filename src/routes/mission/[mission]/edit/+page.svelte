<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import Input from '$lib/controls/Input.svelte';
	import NoContent from '$lib/comp/NoContent.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import type { RepoModule } from '$lib/repo';
	import Select from '$lib/controls/Select.svelte';
	import { Permission, type Completion, type ID, type Bomb, Pool, type MissionPackSelection } from '$lib/types';
	import {
		displayStringList,
		formatDate,
		formatTime,
		getLogfileLinks,
		hasPermission,
		parseDate,
		parseInteger,
		parseList,
		parseTime,
		validateLogfileLink,
		validateMissionID
	} from '$lib/util';
	import { sortBombs } from '../../_shared';
	import type { EditMission } from './_types';
	import { page } from '$app/stores';
	import { applyAction } from '$app/forms';
	import { TP_TEAM } from '$lib/const';
	import TextArea from '$lib/controls/TextArea.svelte';

	export let data;

	let mission: EditMission & { verified: boolean } = data.mission;
	let missionNames: string[] = data.missionNames;
	let packs: MissionPackSelection[] = data.packs;
	let modules: Record<string, RepoModule> | null = data.modules;
	let logfile = mission.logfile ?? '';

	sortBombs(mission, modules);

	let originalMission: EditMission;

	function setOriginalMission() {
		originalMission = JSON.parse(JSON.stringify(mission));
		originalMission.dateAdded = mission.dateAdded;
	}

	for (const bomb of mission.bombs) {
		bomb.pools.sort((a, b) => a.modules.join().localeCompare(b.modules.join()));
	}
	mission.completions.sort((a, b) => b.time - a.time);
	setOriginalMission();

	let modified = false;
	let tpCompletion = false;
	let nameIsSame = false;
	$: {
		let log = getLogfileLinks(logfile);
		mission.logfile = log[0] === '' ? null : log[1];
		nameIsSame = originalMission.name === mission.name;
		if (!nameIsSame && mission.inGameName == null) mission.inGameName = originalMission.name;
		if (mission.inGameName === mission.name) mission.inGameName = null;
		tpCompletion = mission.completions.some(c => c.team[0] === TP_TEAM);
		if (tpCompletion) mission.tpSolve = true;
		let noCompOrig = JSON.parse(JSON.stringify(originalMission));
		let noCompMission = JSON.parse(JSON.stringify(mission));
		noCompOrig.completions = undefined;
		noCompMission.completions = undefined;
		modified = JSON.stringify(noCompOrig) !== JSON.stringify(noCompMission);
	}

	function intnan0(val: number): boolean | string {
		return isNaN(val) ? 'int' : val >= 0 ? true : '≥0';
	}
	function intnan1(val: number): boolean | string {
		return isNaN(val) ? 'int' : val > 0 ? true : '>0';
	}

	async function saveChanges() {
		const fData = new FormData();
		fData.append('mission', JSON.stringify(mission));
		fData.append('variantEdit', JSON.stringify(originalMission.variantOf != mission.variantOf));

		const response = await fetch('?/editMission', {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}

	async function saveCompletion(comp: ID<Completion>, index: number) {
		const fData = new FormData();
		fData.append('completion', JSON.stringify(comp));

		const response = await fetch('?/editCompletion', {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
		shownComp[comp.id] = false;
		originalMission.completions[index] = JSON.parse(JSON.stringify(comp));
	}

	async function deleteMission() {
		if (!confirm('Delete Mission. This cannot be undone. Are you sure?')) return;
		const fData = new FormData();
		fData.append('mission', JSON.stringify(originalMission));

		const response = await fetch('?/deleteMission', {
			method: 'POST',
			body: fData
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
	}

	async function deleteCompletion(completion: ID<Completion>) {
		if (!confirm('Delete Solve. This cannot be undone. Are you sure?')) return;
		const fData = new FormData();
		fData.append('completion', JSON.stringify(completion));

		const response = await fetch('?/deleteCompletion', {
			method: 'POST',
			body: fData
		});

		mission.completions = mission.completions.filter(comp => completion.id !== comp.id);
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
		setOriginalMission();
	}

	async function deletePool(bomb: Bomb, index: number) {
		if (!confirm('Delete Pool. Are you sure?')) return;
		bomb.pools.splice(index, 1);
		mission = mission;
	}
	async function addPool(bomb: Bomb) {
		bomb.pools.push(new Pool([''], 1));
		mission = mission;
	}

	let shownComp = mission.completions.reduce((result: { [id: string]: boolean }, curr) => {
		result[curr.id] = false;
		return result;
	}, {});
	function showComp(id: number) {
		shownComp[id] = !shownComp[id];
	}

	missionNames.unshift('');
</script>

<svelte:head>
	<title>{mission.name}</title>
</svelte:head>
<div class="block relative">
	<div class="flex top-edit-controls">
		<Input label="Name" id="mission-name" bind:value={mission.name} validate={value => value.length > 0} />
		<Input label="Authors" id="mission-authors" bind:value={mission.authors} parse={parseList} />
		<Input
			label="Mission Pack"
			id="mission-pack"
			bind:value={mission.missionPack}
			required
			instantFormat={false}
			options={packs}
			display={pack => pack?.name}
			validate={value => value !== null} />
		<Input
			id="mission-variant"
			label="Variant of"
			options={missionNames}
			validate={value => value !== null}
			bind:value={mission.variantOf} />
	</div>
	<div class:hidden={nameIsSame}>
		<strong class="alert"
			>If you rename the mission, make sure the In-Game Name reflects what the mission is called in its logfile (i.e.
			what it's called in the binder).</strong>
	</div>
	<div class="flex top-edit-controls">
		<Input
			id="mission-ingamename"
			label="In-Game Name"
			parse={val => (val?.trim().length > 0 ? val.trim() : null)}
			display={val => val ?? ''}
			bind:value={mission.inGameName} />
	</div>
	<div class="actions">
		<button on:click={deleteMission}>Delete</button>
	</div>
</div>
<div class="block flex hspace">
	<Select
		label="Factory"
		id="mission-factory"
		bind:value={mission.factory}
		options={[null, 'Static', 'Sequence']}
		display={mode => mode ?? 'None'} />
	<Select
		label="Time Mode"
		id="mission-time-mode"
		bind:value={mission.timeMode}
		options={[null, 'Local', 'Global']}
		display={mode => mode ?? 'None'} />
	<Select
		label="Strike Mode"
		id="mission-strike-mode"
		bind:value={mission.strikeMode}
		options={[null, 'Local', 'Global']}
		display={mode => mode ?? 'None'} />
	<Input
		classes="mission-id-edit"
		name="Mission ID"
		label="Mission ID"
		id="mission-ingameid"
		validate={validateMissionID}
		parse={val => (val?.length > 0 ? val : null)}
		display={val => val ?? ''}
		bind:value={mission.inGameId}
		forceValidate />
	<Input
		type="date"
		id="mission-date"
		label="Date Added"
		classes="light"
		parse={parseDate}
		display={formatDate}
		bind:value={mission.dateAdded} />
	<Checkbox label="Designed for TP" id="designed-for-tp" bind:checked={mission.designedForTP} />
</div>
<div class="block">
	<Input
		label="Logfile Link"
		id="mission-logfile"
		validate={v => (v === '' ? true : validateLogfileLink(v))}
		forceValidate
		bind:value={logfile} />
	{#if mission.logfile !== null}
		<a href={mission.logfile}>Logfile</a>
	{/if}
</div>
<div class="block">
	<TextArea
		id="mission-notes"
		label="Notes"
		autoExpand
		display={val => val ?? ''}
		bind:value={mission.notes}
		parse={val => (val?.length > 0 ? val : null)} />
</div>
{#if !mission.verified}
	<div class="block centered not-verified">This mission has not been verified.</div>
{/if}
<div class="main-content">
	<div class="bombs">
		{#each mission.bombs as bomb}
			<div class="block flex relative">
				<Input
					label="Number of Modules"
					id="bomb-modules-{bomb.id}"
					parse={parseInteger}
					validate={intnan1}
					required
					bind:value={bomb.modules} />
				<Input
					label="Bomb Time"
					id="bomb-time-{bomb.id}"
					type="text"
					parse={parseTime}
					validate={value => value != null}
					display={formatTime}
					instantFormat={false}
					placeholder="1:23:45.67"
					required
					bind:value={bomb.time} />
				<Input
					label="Number of Strikes"
					id="bomb-strikes-{bomb.id}"
					parse={parseInteger}
					validate={intnan1}
					required
					bind:value={bomb.strikes} />
				<Input
					label="Number of Widgets"
					id="bomb-widgets-{bomb.id}"
					parse={parseInteger}
					validate={intnan0}
					required
					bind:value={bomb.widgets} />
			</div>
			<div class="block flex column relative pools">
				{#each bomb.pools as pool, index (pool)}
					<div class="pool">
						<span class="pool-index">{index + 1}: </span>
						<Input
							label="Count"
							id="pool-count-{bomb.id}-{index}"
							classes="pool-count"
							parse={parseInteger}
							validate={intnan1}
							required
							bind:value={pool.count} />
						<Input
							label="Modules (comma-separated)"
							id="pool-modules-{bomb.id}-{index}"
							classes="pool-modules"
							parse={parseList}
							display={displayStringList}
							instantFormat={false}
							validate={value => value != null}
							required
							bind:value={pool.modules} />
						<div class="delete-pool dark-invert" on:click={() => deletePool(bomb, index)}></div>
					</div>
				{/each}
				<button class="add-pool" on:click={() => addPool(bomb)}>Add</button>
			</div>
		{/each}
	</div>
	<div class="flex column">
		<div class="block header">Solves</div>
		{#each mission.completions as completion, ci}
			<div class="block flex column relative">
				{#if shownComp[completion.id]}
					<TextArea
						label="Proof"
						id="completion-proof"
						bind:value={completion.proofs}
						parse={value => value.split(',').map(proof => proof.trim())}
						display={list => list.join(',\n')} />
					<div class="hstack">
						<Input
							label="Time"
							id="completion-time-{ci}"
							validate={value => value != null}
							display={value => formatTime(value, value % 1 != 0)}
							instantFormat={false}
							placeholder="1:23:45.67"
							bind:value={completion.time}
							parse={parseTime} />
						<Checkbox id="completion-solo-{ci}" sideLabel labelAfter label="Solo" bind:checked={completion.solo} />
						<Checkbox id="completion-first-{ci}" sideLabel labelAfter label="First" bind:checked={completion.first} />
						<Checkbox id="completion-old-{ci}" sideLabel labelAfter label="Old" bind:checked={completion.old} />
					</div>
					<Input
						label="Team"
						id="completion-team-{ci}"
						bind:value={completion.team}
						parse={value => value.split(',').map(person => person.trim())}
						display={list => list.join(', ')} />
					<TextArea
						id="completion-notes-{ci}"
						label="Notes"
						autoExpand
						display={val => val ?? ''}
						bind:value={completion.notes}
						parse={val => (val?.length > 0 ? val : null)} />
					<Input
						type="date"
						id="completion-date-{ci}"
						label="Date Added"
						classes="light"
						parse={parseDate}
						display={formatDate}
						bind:value={completion.dateAdded} />
					<div class="hstack centered">
						<button
							on:click={() => saveCompletion(completion, ci)}
							disabled={JSON.stringify(originalMission.completions[ci]) === JSON.stringify(completion)}>Save</button>
					</div>
					{#if hasPermission($page.data.user, Permission.VerifyCompletion)}
						<div class="actions">
							<button on:click={() => deleteCompletion(completion)}>Delete</button>
						</div>
					{/if}
				{:else}
					<div class="relative">
						<CompletionCard {completion} />
						{#if hasPermission($page.data.user, Permission.VerifyCompletion)}
							<button class="actions edit" on:click={() => showComp(completion.id)}>Edit</button>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<NoContent>No solves to edit.</NoContent>
		{/each}
		{#if !tpCompletion}
			<div class="block">
				<Checkbox id="mission-tp" sideLabel labelAfter bind:checked={mission.tpSolve}>
					Solved by <span class="tp-solve">{TP_TEAM}</span>
				</Checkbox>
			</div>
		{/if}
	</div>
</div>
<div class="bottom-center flex" class:visible={modified}>
	<div class="save-changes block flex">
		There are unsaved changes.
		<button on:click={saveChanges}>Save</button>
	</div>
</div>

<style>
	:global(.top-edit-controls > div) {
		width: 24.5%;
	}
	.main-content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: auto 1fr;
		gap: var(--gap);
	}

	@media (max-width: 500px) {
		.main-content {
			display: flex;
			flex-direction: column;
		}
	}

	.bombs {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}

	.not-verified,
	.alert {
		color: red;
	}
	.centered {
		text-align: center;
	}

	.hstack {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}
	.hstack.centered {
		justify-content: center;
	}

	.flex.hspace {
		gap: 20px;
	}

	.pools {
		align-items: center;
	}

	.pool {
		padding: var(--gap);
		flex-grow: 1;
		background: var(--foreground);

		display: flex;
		gap: var(--gap);
		align-items: flex-end;
		justify-content: center;
	}

	:global(.pool input.pool-count) {
		width: 6em;
	}
	:global(.pool input.pool-modules) {
		width: 40em;
	}

	.pool-index {
		margin-bottom: 2px;
		width: 35px;
		text-align: right;
	}

	.delete-pool {
		background: url('$lib/img/clear-button.svg') right center no-repeat;
		width: 1.25em;
		height: 1.25em;
		min-width: 1.25em;
		margin: 0 5px 2px 2px;
		display: inline-block;
		visibility: hidden;
		vertical-align: middle;
		cursor: pointer;
	}
	.pool:hover > .delete-pool {
		visibility: visible;
	}
	.add-pool {
		width: fit-content;
	}

	.tp-solve {
		padding: 1px 3px;
		border-radius: 5px;
		background-color: #9146ff;
	}

	.header {
		font-weight: bold;
		text-align: center;
	}

	.actions.edit {
		left: calc(-1 * var(--gap));
		right: unset;
	}

	.bottom-center {
		position: fixed;
		bottom: var(--gap);
		justify-content: center;
		margin: var(--gap);
		width: calc((min(100vw, 1150px) - 4 * var(--gap)));

		transform: translateY(100%);
		pointer-events: none;
		opacity: 0;
		transition: transform 0.4s, opacity 0.4s;
		transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
	}

	.bottom-center.visible {
		transform: none;
		opacity: 1;
	}

	.save-changes {
		pointer-events: auto;
		justify-content: center;
		align-items: center;
		box-shadow: var(--foreground) 0 0 10px;
		color: #ddd;
		background-color: rgb(15, 15, 15);
	}
	:global(input.mission-id-edit) {
		width: 300px;
	}
</style>
