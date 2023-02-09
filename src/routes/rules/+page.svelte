<script lang="ts">
	import { reservedSearchStrings } from '$lib/util';
</script>

<svelte:head>
	<title>Rules</title>
</svelte:head>

<h1 class="header">Rules</h1>

<body>
	<h2>Rules for Uploading Solves</h2>

	<p>
		In order for a bomb to show on your profile, you must submit it here with the names of everyone who helped solve the
		bomb and their roles with proper verification. Proper verification includes a logfile or recording of the bomb, with
		the latter being required for a Solo solve.
	</p>

	<p>Actions/mods that will invalidate your solve include:</p>
	<ul>
		<li>Using any feature enabled by turning off "Disable Advantageous Features".</li>
		<li>Playing in any timer mode besides Normal mode.</li>
		<li>Taking screenshots or recordings of the bomb during a team solve to aid in solving.</li>
		<li>
			Using local, private, or unlisted mods to give an unfair advantage such as modifying the logging, fixing bomb RNG,
			or replacing modules on the bomb with easier versions.
		</li>
		<li>Using the Twitch Plays or Unity Explorer mods during a solve.</li>
		<li>Using advantageous features from the Command Line mod.</li>
		<li>Using the Magic Stopwatch, Manual Viewer, or Tally Counter mods during your solve.</li>
		<li>Playing in the Manual room.</li>
		<li>Setting the mission seed to anything besides -1.</li>
		<li>Using a mod to change the fonts on the bomb.</li>
		<li>Viewing the logfile of the bomb before it is solved.</li>
		<li>Having Logging appear on a bomb with an ALL_MODS pool.</li>
		<li>Revealing module names using Profile Revealer.</li>
		<li>Using mod settings to make a module significantly easier than default without reason.</li>
		<li>Using a manual not accessible on the repo.</li>
		<li>Using any needy listed below when given the choice of needy.</li>
		<ul>
			<li>Literally Nothing</li>
			<li>Hearthur</li>
			<li>Kawaiitlyn</li>
		</ul>
		<li>
			A defuser taking or using any external notes or props to aid in solving. This excludes using props to aid with
			colorblindness.
		</li>
		<li>An expert viewing the bomb during the solve.</li>
	</ul>

	<h2>Rules for Uploading Missions</h2>

	<p>Missions that break any of the below rules will lead to them being denied by the maintainers:</p>
	<ul>
		<li>It contains less than 47 modules.</li>
		<ul><li>Modules that do nothing such as Literally Nothing do not count towards this total.</li></ul>
		<li>It contains the module Logging.</li>
		<li>It contains too many repeat modules.</li>
		<li>The mission's contents are too similar to those of another mission.</li>
		<li>The mission name is the same as another's on this website.</li>
		<li>The mission name is vulgar or offensive.</li>
		<li>
			The mission name contains any of these reserved character sequences:
			{#each reservedSearchStrings as str, index}
				<b>{str}</b>{index < reservedSearchStrings.length - 1 ? ', ' : '.'}
			{/each}
		</li>
		<li>
			The mission is too easy according to the maintainers. If your mission is denied for this reason, we will give
			pointers to fix this.
		</li>
	</ul>
</body>
