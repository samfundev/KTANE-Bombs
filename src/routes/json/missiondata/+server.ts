import client from '$lib/client';
import { onlyUnique, getModule, hasPermission, forbidden } from '$lib/util';
import { Bomb, Permission, type Mission } from '$lib/types';
import type { MissionPack } from '@prisma/client';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ locals }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.DownloadDatabase)) {
		throw forbidden(locals);
	}
	const missionsObj = await client.mission.findMany({
		select: {
			name: true,
			authors: true,
			bombs: {
				select: {
					modules: true,
					time: true,
					strikes: true,
					widgets: true,
					pools: true
				}
			},
			completions: {
				select: {
					verified: true,
					proofs: true,
					time: true,
					team: true,
					first: true,
					old: true,
					solo: true
				}
			},
			designedForTP: true,
			tpSolve: true,
			factory: true,
			variant: true,
			verified: true,
			missionPack: {
				select: {
					verified: true,
					name: true,
					steamId: true
				}
			}
		}
	});

	let missionPacks: { name: string; steamID: string; verified: boolean, missions: (Mission & { variant: null | number })[] }[] = [];
	missionsObj.forEach(miss => {
		let bombs: Bomb[] = [];
		Object.assign(bombs, miss.bombs);
		let pack = missionPacks.find(mp => mp.steamID == miss.missionPack?.steamId);
		let newMission = {
			name: miss.name,
			authors: miss.authors,
			bombs: bombs,
			completions: miss.completions,
			tpSolve: miss.tpSolve,
			designedForTP: miss.designedForTP,
			factory: miss.factory,
			verified: miss.verified,
			variant: miss.variant
		};
		if (pack) {
			pack.missions.push(newMission);
		} else {
			missionPacks.push({
				name: miss.missionPack?.name ?? '',
				steamID: miss.missionPack?.steamId ?? '',
				verified: miss.missionPack?.verified ?? false,
				missions: [newMission]
			});
		}
	});

	return new Response(JSON.stringify(missionPacks));
};
