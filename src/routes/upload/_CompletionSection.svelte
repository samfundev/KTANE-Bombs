<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { Completion } from '$lib/types';
	import { formatTime, parseTime } from '$lib/util';
	import toast from 'svelte-french-toast';

	export let missionNames: string[];
	export let solverNames: string[];

	let missionName: string = '';

	let completion: Completion = new Completion();

	let valid: boolean = false;

	let missionInvalid = false;
	let timerInvalid = false;

	let team = [{ invalid: false, text: '' }];
	let proofs = [{ invalid: false, text: '' }];

	function dynamicBoxes(inputList: any[]) {
		let max = inputList.length - 1;
		for (let i = 0; i < max; i++) {
			if (inputList[i].text === '') {
				for (let j = i; j < inputList.length - 1; j++) {
					inputList[j] = inputList[j + 1];
				}
				break;
			}
		}
		if (inputList[inputList.length - 1].text !== '') {
			inputList[inputList.length] = { invalid: false, text: '' };
		} else if (inputList.length > 1 && inputList[inputList.length - 2].text === '') {
			inputList.pop();
		}
	}

	function parseURL(text: string): any[] {
		if (text === '') {
			return [true, ''];
		}
		let url: URL | null = null;

		try {
			url = new URL(text);
		} catch (e: any) {
			return [false, 'Invalid URL'];
		}
		if (url?.protocol === 'http:') {
			url.protocol = 'https:';
		}
		if (url?.protocol !== 'https:') {
			return [false, 'Invalid URL'];
		}
		return [true, url.toString()];
	}

	function validateURL(text: any): string | boolean {
		let funcReturn = parseURL(text);
		return !funcReturn[0] ? funcReturn[1] : '';
	}

	function parseTeam(teamList: any[], func: Function | null): string[] {
		let outTeam: string[] = [];
		for (let i = 0; i < teamList.length - 1; i++) {
			if (teamList[i].invalid) {
				return [];
			}
			if (func === null) outTeam[outTeam.length] = teamList[i].text;
			else {
				let funcReturn = func(teamList[i].text);
				if (funcReturn[0]) outTeam[outTeam.length] = funcReturn[1];
			}
		}
		return outTeam;
	}

	$: {
		dynamicBoxes(proofs);
		completion.proofs = parseTeam(proofs, parseURL);

		dynamicBoxes(team);
		completion.team = parseTeam(team, null);

		if (completion.team.length > 1) completion.solo = false;

		valid =
			!missionInvalid &&
			missionName !== '' &&
			completion.proofs.length !== 0 &&
			completion.team.length !== 0 &&
			!timerInvalid;
	}

	function upload() {
		fetch('/upload/completion', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ completion, missionName })
		})
			.then(response => {
				if (response.status == 202) {
					toast.success('Solve REPLACEMENT uploaded successfully!');
				} else if (response.ok) {
					toast.success('Solve uploaded successfully!');
				} else {
					toast.error('Solve failed to upload.');
				}
			})
			.catch(() => toast.error('An error occurred.'));
	}
</script>

<form class="block flex">
	<div class="wideBox">
		<Input
			id="mission"
			label="Mission"
			options={missionNames}
			validate={value => value !== null}
			bind:invalid={missionInvalid}
			bind:value={missionName} />
	</div>
	<div class="wideBox">
		{#each proofs as proof, i}
			<div class="dynamicBlock">
				<Input
					id="proof-{i}"
					type="url"
					label="Proof #{i + 1}"
					placeholder="https://ktane.timwi.de"
					validate={validateURL}
					forceValidate={true}
					bind:invalid={proof.invalid}
					bind:value={proof.text} />
			</div>
		{/each}
	</div>
	<Input
		id="time"
		type="text"
		parse={parseTime}
		validate={value => value != null}
		display={value => formatTime(value, value % 1 != 0)}
		instantFormat={false}
		label="Time Remaining"
		placeholder="1:23:45.67"
		required
		bind:invalid={timerInvalid}
		bind:value={completion.time} />
	<div>
		{#each team as member, index}
			<div class="dynamicBlock">
				<Input
					id="member-{index}"
					type="text"
					label={index == 0 ? 'Defuser' : 'Expert'}
					optionalOptions={true}
					options={solverNames}
					bind:value={member.text} />
			</div>
		{/each}
	</div>
	<Checkbox id="solo" label="Solo" bind:checked={completion.solo} disabled={completion.team.length > 1} />
</form>
<CompletionCard {completion} />
<div class="block">
	<button on:click={upload} disabled={!valid}>Upload</button>
</div>

<style>
	form {
		gap: calc(var(--gap) * 2);
	}
	.dynamicBlock + .dynamicBlock {
		margin-top: 10px;
	}
	.wideBox {
		width: 25%;
	}
</style>
