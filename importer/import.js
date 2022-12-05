import { readFileSync } from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

(async function () {
	const client = new PrismaClient();

	const packs = JSON.parse(readFileSync('bombs.json').toString());
	for (const pack of packs) {
		const missionPack = await client.missionPack.upsert({
			create: {
				name: pack.name,
				steamId: pack.steamID,
				verified: pack.verified
			},
			update: {
				steamId: pack.steamID,
				verified: pack.verified
			},
			where: {
				name: pack.name
			}
		});

		for (const mission of pack.missions) {
			await client.mission.upsert({
				create: {
					name: mission.name,
					authors: mission.authors,
					bombs: {
						create: mission.bombs
					},
					completions: {
						create: mission.completions
					},
					tpSolve: mission.tpSolve,
					designedForTP: mission.designedForTP,
					factory: mission.factory,
					variant: mission.variant,
					verified: mission.verified,
					missionPackId: missionPack.id
				},
				update: {
					tpSolve: mission.tpSolve,
					designedForTP: mission.designedForTP,
					factory: mission.factory,
					variant: mission.variant,
					verified: mission.verified,
					missionPackId: missionPack.id
				},
				where: {
					name: mission.name
				}
			});
		}
	}
})();
