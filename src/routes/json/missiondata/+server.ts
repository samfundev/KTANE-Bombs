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
			id: true,
			authors: true,
			bombs: {
				orderBy: { id: 'asc' },
				select: {
					modules: true,
					time: true,
					strikes: true,
					widgets: true,
					pools: true
				}
			},
			completions: {
				orderBy: { id: 'asc' },
				select: {
					verified: true,
					id: true,
					proofs: true,
					time: true,
					team: true,
					first: true,
					notes: true,
					old: true,
					dateAdded: true,
					uploadedBy: true,
					solo: true
				}
			},
			designedForTP: true,
			tpSolve: true,
			factory: true,
			strikeMode: true,
			timeMode: true,
			variant: true,
			verified: true,
			logfile: true,
			dateAdded: true,
			uploadedBy: true,
			notes: true,
			missionPack: {
				select: {
					id: true,
					verified: true,
					name: true,
					dateAdded: true,
					uploadedBy: true,
					steamId: true
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
		id: number;
		name: string;
		steamID: string;
		verified: boolean;
		dateAdded: Date | null;
		missions: any[]; //(Mission & { variant: null | number })[];
	}[] = [];
	missionsObj.forEach(miss => {
		let bombs: Bomb[] = [];
		Object.assign(bombs, miss.bombs);
		let pack = missionPacks.find(mp => mp.name == miss.missionPack?.name);
		for (let i = 0; i < miss.completions.length; i++) minimize(miss.completions[i]);
		let newMission = {
			name: miss.name,
			id: miss.id,
			authors: miss.authors,
			bombs: bombs,
			completions: miss.completions,
			tpSolve: miss.tpSolve,
			designedForTP: miss.designedForTP,
			factory: miss.factory,
			strikeMode: miss.strikeMode,
			timeMode: miss.timeMode,
			verified: miss.verified,
			logfile: miss.logfile,
			dateAdded: miss.dateAdded,
			uploadedBy: miss.uploadedBy,
			notes: miss.notes,
			variant: miss.variant
		};
		minimize(newMission);
		if (pack) {
			pack.missions.push(newMission);
		} else {
			let p = {
				id: miss.missionPack?.id ?? 0,
				name: miss.missionPack?.name ?? '',
				steamID: miss.missionPack?.steamId ?? '',
				verified: miss.missionPack?.verified ?? false,
				dateAdded: miss.missionPack?.dateAdded ?? null,
				uploadedBy: miss.missionPack?.uploadedBy ?? null,
				missions: [newMission]
			};
			minimize(p);
			missionPacks.push(p);
		}
	});

	const packs = await client.missionPack.findMany({
		orderBy: { id: 'asc' },
		select: {
			id: true,
			name: true,
			steamId: true,
			missions: true,
			dateAdded: true,
			uploadedBy: true,
			verified: true
		}
	});
	packs.forEach(p => {
		if (missionPacks.findIndex(mp => mp.name == p.name) < 0) {
			let pack = {
				id: p.id,
				name: p.name,
				steamID: p.steamId,
				verified: p.verified,
				dateAdded: p.dateAdded ?? null,
				uploadedby: p.uploadedBy,
				missions: []
			};
			minimize(pack);
			missionPacks.push(pack);
		}
	});
	missionPacks.sort((a, b) => dateAddedSort(a, b));

	return new Response(JSON.stringify(missionPacks));
};
