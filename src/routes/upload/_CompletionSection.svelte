<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import Input from '$lib/controls/Input.svelte';
	import type { Completion } from '$lib/types.svelte';
	import { formatTime, getLogfileLinks, parseTime } from '$lib/util';
	import toast from 'svelte-french-toast';
	import { TP_TEAM } from '$lib/const';

	interface Props {
		missionInfo: { [name: string]: any };
		solverNames: string[];
	}

	let { missionInfo, solverNames }: Props = $props();

	let missionNames = Object.keys(missionInfo).sort((a, b) => a.localeCompare(b));
	let missionName: string = $state('');

	let completion: Completion = $state({
		proofs: [],
		time: 0,
		team: [],
		first: false,
		old: false,
		solo: false,
		notes: null,
		dateAdded: null,
		uploadedBy: null
	});
	completion.dateAdded = new Date();

	let missionInvalid = $state(false);
	let timerInvalid = $state(false);

	let valid: boolean = $derived(
		!missionInvalid &&
			missionName !== '' &&
			completion.proofs.length !== 0 &&
			completion.team.length !== 0 &&
			!timerInvalid
	);

	let team = $state([{ invalid: false, text: '' }]);
	let proofs = $state([{ invalid: false, text: '' }]);
	let tpSolve = $state(false);
	const MIN_TIME = 0.01;
	let parsedTimes: number[] = $state([MIN_TIME]);
	let parsedLogfiles: string[] = [];
	let timeInput = $state() as Input;

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

	function getInfo(text: string) {
		let lineIndex = 0;
		const lines = text.split('\n').map(line => (line.length > 20000 ? '' : line));

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
					let match = missionNames.find(
						name =>
							event.mission.toLowerCase() ===
							(missionInfo[name]['ingame'] != null ? missionInfo[name]['ingame'] : name).toLowerCase()
					);
					if (match !== undefined) {
						missionName = match;
						time = 0;
					}
				} else if (event.type === 'BOMB_SOLVE' && event.bombTime) {
					let n = parseFloat(event.bombTime);
					if (!isNaN(n)) {
						n = Math.max(Math.round(n * 100) / 100, MIN_TIME);
						if (
							missionInfo[missionName] != undefined &&
							missionInfo[missionName]['factory'] === 'Sequence' &&
							missionInfo[missionName]['timeMode'] !== 'Global'
						)
							time = Math.min(time + n, missionInfo[missionName]['time']);
						else time = n;
						parsedTimes.push(n);
						timeInput.setValue(time);
					}
				}
			}
		}
	}

	function validateTime(time: number): string | boolean {
		let maxTime =
			missionName.length > 0 || missionInfo[missionName] == undefined ? Infinity : missionInfo[missionName]['time'];
		if (time == null) return 'Invalid time';
		else if (time >= maxTime) return `Time must be < mission's given time (${formatTime(maxTime)})`;
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
							.then(f => getInfo(f));
					}
				}
			}
		}
		return outTeam;
	}

	$effect(() => {
		dynamicBoxes(proofs);
		completion.proofs = parseTeam(proofs, parseURL);

		dynamicBoxes(team);
		const newTeam = parseTeam(team, null);

		if (newTeam.length > 1) {
			completion.solo = false;
			tpSolve = false;
		}

		completion.team = newTeam;
	});

	function tpChange() {
		if (tpSolve) {
			completion.solo = false;
			team = [{ invalid: false, text: TP_TEAM }];
		} else team = [{ invalid: false, text: '' }];
	}

	function teamChange() {
		if (team[0].text === TP_TEAM) tpSolve = true;
		else {
			for (let i = 0; i < team.length; i++) {
				let matchedName = solverNames.find(name => team[i].text.toLowerCase() === name.toLowerCase());
				if (matchedName != undefined && matchedName !== team[i].text) {
					team[i].text = matchedName;
				}
			}
		}
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
		bind:value={completion.time}
		disabled={missionName == null || missionName.length < 1} />
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
					onchange={teamChange}
					bind:value={member.text} />
			</div>
		{/each}
	</div>
	<Checkbox
		id="solo"
		label="Solo"
		class="help"
		title="A solo solve is done entirely from memory, without using any experts, manuals, notes, or external tools. Video evidence must be provided for solo solves."
		bind:checked={completion.solo}
		disabled={tpSolve || completion.team.length > 1} />
	<Checkbox
		id="tpSolve"
		label="TP Solve"
		bind:checked={tpSolve}
		onchange={tpChange}
		disabled={completion.solo || completion.team.length > 1} />
</form>
<CompletionCard {completion} />
<div class="block">
	<button onclick={upload} disabled={!valid}>Upload</button>
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
