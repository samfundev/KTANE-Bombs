import { readFileSync } from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

(async function () {
	const showOnlyVerified = false;
	const howMany = 40;
	const packs = JSON.parse(readFileSync('bombs.json').toString());
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
				dateAdded: mission.dateAdded,
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
					verified: completion.verified
				});
			}
		}
	}
	missions.sort((a, b) => parseInt(b.id) - parseInt(a.id));
	completions.sort((a, b) => parseInt(b.id) - parseInt(a.id));

	console.log('Packs');
	let count, i;
	for (count = 0, i = 1; count < howMany; i++, count++) {
		let pack = packs[packs.length - i];
		if (!showOnlyVerified || pack.verified) {
			pack.missions = pack.missions.map(m => m.name);
			console.log(pack);
		} else count -= 1;
	}
	console.log('\nMissions');
	for (count = 0, i = 0; count < howMany; i++, count++) {
		if (!showOnlyVerified || !missions[i].verified) console.log(missions[i]);
		else count -= 1;
	}
	console.log('\nCompletions');
	for (count = 0, i = 0; count < howMany; i++, count++) {
		if (!showOnlyVerified || !completions[i].verified) console.log(completions[i]);
		else count -= 1;
	}
})();
