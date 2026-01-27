import client from '$lib/client';
import { getData } from '$lib/repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			id: true,
			name: true,
			authors: true,
			bombs: true,
			designedForTP: true,
			tpSolve: true,
			factory: true,
			timeMode: true,
			strikeMode: true,
			dateAdded: true,
			completions: {
				where: { verified: true }
			}
		},
		orderBy: { dateAdded: 'desc' }
	});

	const modules = (await getData()) ?? {};
	const simpleModules = {};
	for (const [key, module] of Object.entries(modules)) {
		simpleModules[key] = {
			ModuleID: module.ModuleID,
			Name: module.Name,
			Published: module.Published,
			Type: module.Type,
			X: module.X,
			Y: module.Y,
			valid: module.valid,
			BossStatus: module.BossStatus,
			Quirks: module.Quirks,
			FileName: module.FileName
		};
	}

	const now = new Date();
	const currentSeason = await client.season.findFirst({
		where: {
			start: { lte: now },
			end: { gte: now }
		},
		select: {
			missionsStart: true,
			missionsEnd: true,
			whitelist: true
		},
		orderBy: {
			id: 'desc'
		}
	});
	let seasonMissionsResult: {name: string}[] = !currentSeason ? [] : await client.mission.findMany({
		where: {
			OR: [
				{
					dateAdded: {
						gte: currentSeason.missionsStart,
						lte: currentSeason.missionsEnd
					},
					verified: true
				},
				{
					id: { in: currentSeason.whitelist },
					verified: true
				}
			]
		},
		select: {
			name: true
		},
		orderBy: { dateAdded: 'asc' }
	});

	return {
		missions: missions.map(miss => {
			return { ...miss, logfile: null, notes: null, uploadedBy: null, inGameId: null, inGameName: null };
		}),
		modules: simpleModules,
		seasonMissions: seasonMissionsResult.map(m => m.name)
	};
};
