import client from '$lib/client';
import { Bomb, Permission } from '$lib/types';
import { dateAddedSort, forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ locals }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.DownloadDatabase)) {
		throw forbidden(locals);
	}
	const missionsObj = await client.mission.findMany({
		orderBy: { id: 'asc' },
		select: {
			name: true,
			authors: true,
			bombs: {
				orderBy: { id: 'asc' },
				select: {
					modules: true,
					strikes: true,
					time: true,
					widgets: true,
					pools: true
				}
			},
			completions: {
				orderBy: { id: 'asc' },
				select: {
					dateAdded: true,
					first: true,
					id: true,
					notes: true,
					old: true,
					proofs: true,
					solo: true,
					team: true,
					time: true,
					uploadedBy: true,
					verified: true
				}
			},
			dateAdded: true,
			designedForTP: true,
			factory: true,
			id: true,
			inGameId: true,
			logfile: true,
			notes: true,
			strikeMode: true,
			timeMode: true,
			tpSolve: true,
			uploadedBy: true,
			variant: true,
			verified: true,
			missionPack: {
				select: {
					name: true,
					dateAdded: true,
					id: true,
					steamId: true,
					uploadedBy: true,
					verified: true
				}
			}
		}
	});

	function minimize(obj: any) {
		Object.keys(obj).forEach(k => {
			if (obj[k] == null) delete obj[k];
		});
	}

	let missionPacks: {
		name: string;
		dateAdded: Date | null;
		id: number;
		missions: any[];
		steamID: string;
		verified: boolean;
	}[] = [];
	missionsObj.forEach(miss => {
		let bombs: Bomb[] = [];
		Object.assign(bombs, miss.bombs);
		let pack = missionPacks.find(mp => mp.name == miss.missionPack?.name);
		for (let i = 0; i < miss.completions.length; i++) minimize(miss.completions[i]);
		let newMission = {
			name: miss.name,
			authors: miss.authors,
			bombs: bombs,
			completions: miss.completions,
			dateAdded: miss.dateAdded,
			designedForTP: miss.designedForTP,
			factory: miss.factory,
			id: miss.id,
			inGameId: miss.inGameId,
			logfile: miss.logfile,
			notes: miss.notes,
			strikeMode: miss.strikeMode,
			timeMode: miss.timeMode,
			tpSolve: miss.tpSolve,
			uploadedBy: miss.uploadedBy,
			variant: miss.variant,
			verified: miss.verified
		};
		minimize(newMission);
		if (pack) {
			pack.missions.push(newMission);
		} else {
			let p = {
				name: miss.missionPack?.name ?? '',
				dateAdded: miss.missionPack?.dateAdded ?? null,
				id: miss.missionPack?.id ?? 0,
				missions: [newMission],
				steamID: miss.missionPack?.steamId ?? '',
				uploadedBy: miss.missionPack?.uploadedBy ?? null,
				verified: miss.missionPack?.verified ?? false
			};
			minimize(p);
			missionPacks.push(p);
		}
	});

	const packs = await client.missionPack.findMany({
		orderBy: { id: 'asc' },
		select: {
			name: true,
			dateAdded: true,
			id: true,
			missions: true,
			steamId: true,
			uploadedBy: true,
			verified: true
		}
	});
	packs.forEach(p => {
		if (missionPacks.findIndex(mp => mp.name == p.name) < 0) {
			let pack = {
				name: p.name,
				dateAdded: p.dateAdded ?? null,
				id: p.id,
				missions: [],
				steamID: p.steamId,
				uploadedby: p.uploadedBy,
				verified: p.verified
			};
			minimize(pack);
			missionPacks.push(pack);
		}
	});
	missionPacks.sort((a, b) => dateAddedSort(a, b));

	return new Response(JSON.stringify(missionPacks));
};
