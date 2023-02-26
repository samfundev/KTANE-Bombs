import { readFileSync } from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

(async function () {
	const client = new PrismaClient();

	let packs = JSON.parse(readFileSync('bombs.json').toString());
	for (let i = 0; i < packs.length; i++) {
		if (packs[i].dateAdded != null) packs[i].dateAdded = new Date(packs[i].dateAdded);
	}

	packs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	let missions = [];
	let completions = [];
	for (const pack of packs) {
		const missionPack = await client.missionPack.upsert({
			create: {
				name: pack.name,
				steamId: pack.steamID,
				dateAdded: new Date(pack.dateAdded),
				verified: pack.verified
			},
			update: {
				steamId: pack.steamID,
				dateAdded: new Date(pack.dateAdded),
				verified: pack.verified
			},
			where: {
				name: pack.name
			}
		});

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
				missionPackId: missionPack.id
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
					missionId: mission.id,
					missionName: mission.name,
					dateAdded: completion.dateAdded == null ? null : new Date(completion.dateAdded),
					verified: completion.verified
				});
			}
		}
	}
	missions.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	completions.sort((a, b) => parseInt(a.id) - parseInt(b.id));

	let missionQueries = [];
	for (const mission of missions) {
		missionQueries.push(
			client.mission.upsert({
				create: {
					name: mission.name,
					authors: mission.authors,
					bombs: {
						create: mission.bombs
					},
					tpSolve: mission.tpSolve,
					designedForTP: mission.designedForTP,
					factory: mission.factory,
					strikeMode: mission.strikeMode,
					timeMode: mission.timeMode,
					variant: mission.variant,
					verified: mission.verified,
					dateAdded: mission.dateAdded,
					missionPackId: mission.missionPackId
				},
				update: {
					authors: mission.authors,
					tpSolve: mission.tpSolve,
					designedForTP: mission.designedForTP,
					factory: mission.factory,
					strikeMode: mission.strikeMode,
					timeMode: mission.timeMode,
					variant: mission.variant,
					verified: mission.verified,
					dateAdded: mission.dateAdded,
					missionPackId: mission.missionPackId
				},
				where: {
					name: mission.name
				}
			})
		);
	}
	await client.$transaction(missionQueries);

	let completionQueries = [];
	for (const [index, completion] of completions.entries()) {
		const comp = await client.completion.findMany({
			where: {
				mission: {
					name: completion.missionName
				},
				team: { has: completion.team[0] }
			}
		});
		let equalSolve = comp.findIndex(
			c =>
				JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
				JSON.stringify(completion.team.slice(0, 1).concat(completion.team.slice(1).sort()))
		);

		if (equalSolve < 0) {
			completionQueries.push(
				client.completion.create({
					data: {
						proofs: completion.proofs,
						time: completion.time,
						team: completion.team,
						first: completion.first,
						old: completion.old,
						solo: completion.solo,
						notes: completion.notes,
						mission: {
							connect: { name: completion.missionName }
						},
						dateAdded: completion.dateAdded,
						verified: completion.verified
					}
				})
			);
		} else {
			completionQueries.push(
				client.completion.update({
					where: {
						id: comp[equalSolve].id
					},
					data: {
						proofs: completion.proofs,
						time: completion.time,
						team: completion.team,
						first: completion.first,
						old: completion.old,
						solo: completion.solo,
						notes: completion.notes,
						dateAdded: completion.dateAdded,
						verified: completion.verified
					}
				})
			);
		}
	}
	await client.$transaction(completionQueries);
})();
