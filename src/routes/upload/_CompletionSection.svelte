<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { Completion, type FrontendUser } from '$lib/types';
	import { formatTime, getLogfileLinks, parseTime } from '$lib/util';
	import toast from 'svelte-french-toast';
	import { TP_TEAM } from '$lib/const';

	export let missionNames: string[];
	export let solverNames: string[];
	export let user: FrontendUser;
	export let factoryStatus: { [name: string]: string | null };

	let missionName: string = '';

	let completion: Completion = new Completion();
	completion.dateAdded = new Date();

	let valid: boolean = false;

	let missionInvalid = false;
	let timerInvalid = false;

	let team = [{ invalid: false, text: '' }];
	let proofs = [{ invalid: false, text: '' }];
	let tpSolve = false;
	const MIN_TIME = 0.01;
	let parsedTimes: number[] = [MIN_TIME];
	let parsedLogfiles: string[] = [];
	let timeInput: Input;

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

	function getTimes(text: string) {
		let lineIndex = 0;
		const lines = text.split('\n');

		function readLine() {
			return lines[lineIndex++];
		}

		let time = 0;
		while (lineIndex < lines.length) {
			let line = readLine().trim();
			if (line.startsWith('[Tweaks] LFAEvent ')) {
				const match = line.match(/LFAEvent (\d+)/);
				if (match === null) throw new Error('This regex should always match');

				let json = '';
				for (let i = 0; i < parseInt(match[1]); i++) {
					json += readLine();
				}

				const event = JSON.parse(json);
				if (event.type === 'ROUND_START' && event.mission) {
					let match = missionNames.find(name => name.toLowerCase() === event.mission.toLowerCase());
					if (match !== undefined) {
						missionName = match;
						time = 0;
					}
				} else if (event.type === 'BOMB_SOLVE' && event.bombTime) {
					let n = parseFloat(event.bombTime);
					if (!isNaN(n)) {
						n = Math.max(Math.round(n * 100) / 100, MIN_TIME);
						if (factoryStatus[missionName] === 'Sequence') time += n;
						else time = n;
						parsedTimes.push(n);
						timeInput.setValue(time);
					}
				}
			}
		}
		// console.log(parsedTimes);
	}

	function validateTime(time: number): string | boolean {
		if (time == null) return 'Invalid time';
		else if (time > 0) return true;
		else return 'Time must be ≥ 0.01s';
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
				//URL
				let funcReturn = func(teamList[i].text);
				if (funcReturn[0]) {
					outTeam[outTeam.length] = funcReturn[1];
					let links = getLogfileLinks(funcReturn[1]);
					if (links[0] !== '' && !parsedLogfiles.includes(links[0])) {
						parsedLogfiles.push(links[0]);
						fetch(links[0])
							.then(v => v.text())
							.then(f => getTimes(f));
					}
				}
			}
		}
		return outTeam;
	}

	$: {
		dynamicBoxes(proofs);
		completion.proofs = parseTeam(proofs, parseURL);

		dynamicBoxes(team);
		completion.team = parseTeam(team, null);

		if (completion.team.length > 1) {
			completion.solo = false;
			tpSolve = false;
		}

		valid =
			!missionInvalid &&
			missionName !== '' &&
			completion.proofs.length !== 0 &&
			completion.team.length !== 0 &&
			!timerInvalid;
	}

	function tpChange() {
		if (tpSolve) {
			completion.solo = false;
			team = [{ invalid: false, text: TP_TEAM }];
		} else team = [{ invalid: false, text: '' }];
	}

	function teamChange() {
		if (team[0].text === TP_TEAM) tpSolve = true;
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
				} else if (response.status == 409) {
					toast.error('Solve already exists in the verify queue.');
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
	<div class="wideBox">
		<Input
			id="mission"
			label="Mission"
			options={missionNames}
			validate={value => value !== null}
			bind:invalid={missionInvalid}
			bind:value={missionName} />
	</div>
	<Input
		bind:this={timeInput}
		id="time"
		type="text"
		parse={parseTime}
		validate={validateTime}
		display={value => formatTime(value, value % 1 != 0)}
		instantFormat={false}
		label="Time Remaining"
		placeholder="1:23:45.67"
		bind:options={parsedTimes}
		optionalOptions
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
					disabled={tpSolve}
					on:change={teamChange}
					bind:value={member.text} />
			</div>
		{/each}
	</div>
	<Checkbox id="solo" label="Solo" bind:checked={completion.solo} disabled={tpSolve || completion.team.length > 1} />
	<Checkbox
		id="tpSolve"
		label="TP Solve"
		bind:checked={tpSolve}
		on:change={tpChange}
		disabled={completion.solo || completion.team.length > 1} />
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
