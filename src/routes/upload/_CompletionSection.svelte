<script lang="ts">
	import Checkbox from '$lib/controls/Checkbox.svelte';
	import CompletionCard from '$lib/cards/CompletionCard.svelte';
	import Input from '$lib/controls/Input.svelte';
	import { Completion } from '$lib/types';
	import { formatTime, parseList, parseTime } from '$lib/util';
	import toast from 'svelte-french-toast';

	export let missionNames: string[];
	export let solverNames: string[];

	let missionName: string = '';
	let teamString: string = '';

	let completion: Completion = new Completion();
	let proofString: string = '';

	let valid: boolean = false;

	let team = [{label:"Defuser", text:""}];
	let proofs = [""];

	function dynamicProofBoxes(){
		for(let i = 0; i < proofs.length; i++){
			if(proofs[i] === "" && i != proofs.length-1){
				for(let j = i; j < proofs.length-1; j++){
					proofs[j] = proofs[j+1];
				}
				proofs.pop();
				i--;
				continue;
			}
		}
		if(proofs[proofs.length-1] !== ""){
			proofs[proofs.length] = "";
		}
	}

	function validateUrl(text:any) : string | boolean{
		if(text === ""){
			return '';
		}
		let url: URL | null = null;

			try{
				url = new URL(text);
			} catch (e : any){
					return "Invalid url";
			}
			if (url?.protocol === 'http:') {
				url.protocol = 'https:';
			}
			if(url?.protocol !== "https:"){
				return "Invalid url";
			}
		return '';
	}
	

		

	function parseUrls(urlList: any[]) : string[]{
		let outUrls: string[] = [];
		for(let i = 0; i < urlList.length-1; i++){
			let url: URL | null = null;
			try{
				url = new URL(urlList[i]);
			} catch{}
			if (url?.protocol === 'http:') {
				url.protocol = 'https:';
			}

			if (url?.protocol === 'https:') {
				outUrls[outUrls.length] = url.toString();
			}
		}
		return outUrls;
	}
	

	function dynamicTeamBoxes(){
		for(let i = 0; i < team.length; i++){
			if(team[i].text === "" && i != team.length-1){
				for(let j = i; j < team.length-1; j++){
					team[j] = team[j+1];
				}
				team.pop();
				i--;
				continue;
			}
			if(i == 0){
				team[i].label = "Defuser"
			}
		}
		if(team[team.length-1].text !== ""){
			team[team.length] = {label:"Expert",text:""};
		}
	}

	function parseTeam(teamList : any) :string[] {
		let outTeam :string[] = [];
		for(let i = 0; i < teamList.length-1; i++){
			outTeam[i] = teamList[i].text;
		}
		return outTeam;
	}

	$: {
		dynamicProofBoxes();
		completion.proofs = parseUrls(proofs)

		dynamicTeamBoxes();
		completion.team = parseTeam(team);

		if (completion.team.length > 1) completion.solo = false;

		valid = missionNames.includes(missionName) && completion.proofs.length !== 0 && completion.team.length !== 0;
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
				if (response.ok) {
					toast.success('Solve uploaded successfully!');
				} else {
					toast.error('Solve failed to upload.');
				}
			})
			.catch(() => toast.error('An error occurred.'));
	}
</script>

<form class="block flex">
	<Input
		id="mission"
		label="Mission"
		options={missionNames}
		validate={value => value !== null}
		bind:value={missionName} />
	<div>
		{#each proofs as proof, i}
			<Input id="proof" type="url" label="Proof #{i+1}" placeholder="https://ktane.timwi.de" validate={validateUrl} bind:value={proof} />
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
		bind:value={completion.time} />
		<div>
			{#each team as member}
				<Input id="member" type="text" label={member.label} optionalOptions={true} options={solverNames} bind:value={member.text} />
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
</style>
