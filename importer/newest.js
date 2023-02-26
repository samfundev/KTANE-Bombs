import { readFileSync } from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

(async function () {
	const showOnlyVerified = false;
	const howMany = 40;
	let packs = JSON.parse(readFileSync('bombs.json').toString());
	for (let i = 0; i < packs.length; i++) {
		if (packs[i].dateAdded != null) packs[i].dateAdded = new Date(packs[i].dateAdded);
	}
	function dateAddedSort(a, b) {
		return a.dateAdded == null || b.dateAdded == null
			? parseInt(b.id) - parseInt(a.id)
			: b.dateAdded.getTime() - a.dateAdded.getTime();
	}

	packs.sort(dateAddedSort);
	let missions = [];
	let completions = [];
	for (const pack of packs) {
		for (const mission of pack.missions) {
			missions.push({
				id: mission.id,
				name: mission.name,
				authors: mission.authors,
				bombs: mission.bombs,
				tpSolve: mission.tpSolve,
				designedForTP: mission.designedForTP,
				factory: mission.factory,
				strikeMode: mission.strikeMode,
				timeMode: mission.timeMode,
				variant: mission.variant,
				verified: mission.verified,
				dateAdded: mission.dateAdded == null ? null : new Date(mission.dateAdded),
				missionPack: pack.name
			});
			for (const completion of mission.completions) {
				completions.push({
					id: completion.id,
					proofs: completion.proofs,
					time: completion.time,
					team: completion.team,
					first: completion.first,
					old: completion.old,
					solo: completion.solo,
					notes: completion.notes,
					missionName: mission.name,
					dateAdded: completion.dateAdded == null ? null : new Date(completion.dateAdded),
					verified: completion.verified
				});
			}
		}
	}
	missions.sort(dateAddedSort);
	completions.sort(dateAddedSort);

	console.log('----------Packs----------');
	let count, i;
	for (count = 0, i = 0; count < howMany; i++, count++) {
		if (!showOnlyVerified || pack.verified) {
			packs[i].missions = packs[i].missions.map(m => m.name);
			console.log(packs[i]);
		} else count -= 1;
	}
	console.log('\n----------Missions----------');
	for (count = 0, i = 0; count < howMany; i++, count++) {
		if (!showOnlyVerified || !missions[i].verified) console.log(missions[i]);
		else count -= 1;
	}
	console.log('\n----------Completions----------');
	for (count = 0, i = 0; count < howMany; i++, count++) {
		if (!showOnlyVerified || !completions[i].verified) console.log(completions[i]);
		else count -= 1;
	}
})();
