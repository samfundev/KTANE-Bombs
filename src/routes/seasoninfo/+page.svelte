<script lang="ts">
	import { reservedSearchStrings } from '$lib/util';
</script>

<svelte:head>
	<title>Season</title>
</svelte:head>

<h1 class="header">Season</h1>

<div class="block">
	Participation in seasons is optional. If you intend to only submit your solves to the global leaderboard you can
	ignore the information in this page.
</div>

<div class="block">
	Season 1: The Beginning - January 1st to March 31st (23:59 GMT) 2025.
</div>

<div class="block">
	<h2>What are seasons?</h2>

	<ul>
		<li>Seasons are timed events that will last for approximately 3 months each. During each season, players will
		    compete for who can solve the most bombs that fit certain criteria explained in this page.</li>
		<li>The leaderboard for the season is separate from the global leaderboard, and is available through the
		    "Season" button on top of this page.</li>
		<li>The season leaderboards are not shared between seasons and players can only add solves to the leaderboard
		    of a season during the 3 months that season is active.</li>
		<li>If you want a solve to be considered for the ongoing season, you need to activate the respective checkmark
			during the upload of the solve.</li>
        <li>At the end of each season, the top 3 players in each of these categories will get a reward:
            EFM solves, Expert solves, Defuser solves. The rewards will last during the following season and are:</li>
        <ul>
            <li>1st of each category: Colored name in this site + Colored role in the official KTANE server.</li>
            <li>2nd of each category: Colored name in this site</li>
            <li>3rd of each category: Colored name in this site</li>
        </ul>
	</ul>

</div>
<div class="block">
	<h2>Permanent Rules</h2>

	<p>These rules need to be followed for any season solve</p>
	<ul>
		<li>Every rule present in the rules page also applies to the seasons.</li>
        <li>Each player participating in a solve must record their POV and submit it as evidence during solve upload.
            Different roles require different screens recorded:</li>
        <ul>
            <li>Defuser: must record the bomb and the audio communication with the experts.</li>
            <li>Experts: must record any tools they use (this includes manuals, notepads,
                calculators, drawing tools and others).</li>
            <li>EFM: must record the bomb and any tools they use.</li>
        </ul>

		<li>Season solves must be of bombs submitted to this website within the 3 months prior to the current
		    season's beginning date. Each season can have exceptions to this rule</li>
	</ul>
</div>

<div class="block">
	<h2>Season 1 Rules</h2>

	<p>These rules need to be followed for season 1 solves</p>
	<ul>
		<li>Experts and EFM can only use notepads with no extra functionalities other than taking notes,
		    non-restricted <a href="https://ktane.timwi.de/">repository</a> manuals and calculators for basic arithmetic.
		     Any other tool is not allowed.</li>
		<li>The following bombs are also allowed for season 1 solves:</li>
        <ul>
            <li><a href="https://bombs.samfun.dev/mission/Easy%20Challenge">Easy Challenge</a></li>
            <li><a href="https://bombs.samfun.dev/mission/Centurion">Centurion</a></li>
            <li><a href="https://bombs.samfun.dev/mission/One-Souvenir%20Army">One-Souvenir Army</a></li>
        </ul>
	</ul>
</div>

<div class="block">
	<h2>FAQ</h2>

	<ul>
		<li>Are the extra functionalities in the <a href="https://files.timwi.de/Tools/Calculator.html">Text Field
		    Calculator</a>, such as variable saving, allowed for season 1 solves?</li>
        <ul>
            <li>No. The TFC can be used for note taking and basic arithmetic (addition, subtraction, multiplication,
                division and powers), but no extra functionalities are allowed.</li>
        </ul>

        <li>I submitted a solve to the site before the season started, but it fits the criteria required for the current
            season. Can it be used as a season solve?</li>
        <ul>
            <li> No, you would need to solve it again.</li>
        </ul>

        <li>Are base converters/caesar cipher decryptors/macros/automatic line numbering allowed for season 1 solves?</li>
        <ul>
            <li> No.</li>
        </ul>

        <li>For technical reasons one of the players can't fit their own POV in a single video. Can they submit more
            than 1 video as evidence?</li>
        <ul>
            <li> Yes.</li>
        </ul>
	</ul>
</div>

<style>
	a.link {
		color: var(--text-color);
	}
</style>
