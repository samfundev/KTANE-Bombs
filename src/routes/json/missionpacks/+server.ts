import client from '$lib/client';
import { Bomb } from '$lib/types';
import { dateAddedSort, getSolveTypes } from '$lib/util';
import { minimize } from '../_util';
import { TP_TEAM } from '$lib/const';

export async function GET() {
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
				select: {
					first: true,
					notes: true,
					proofs: true,
					solo: true,
					team: true,
					time: true
				},
				where: {
					AND: {
						NOT: {
							team: { has: TP_TEAM }
						},
						verified: true
					}
				},
				orderBy: {
					time: 'desc'
				}
			},
			dateAdded: true,
			designedForTP: true,
			factory: true,
			inGameId: true,
			inGameName: true,
			logfile: true,
			notes: true,
			strikeMode: true,
			timeMode: true,
			tpSolve: true,
			variant: true,
			missionPack: {
				select: {
					name: true,
					dateAdded: true,
					id: true,
					steamId: true
				}
			}
		},
		where: {
			verified: true
		}
	});

	let missionPacks: {
		name: string;
		dateAdded: Date | null;
		id: number;
		missions: any[];
		steamID: string;
	}[] = [];
	missionsObj.forEach(miss => {
		let bombs: Bomb[] = [];
		Object.assign(bombs, miss.bombs);
		let pack = missionPacks.find(mp => mp.name == miss.missionPack?.name);
		for (let i = 0; i < miss.completions.length; i++) minimize(miss.completions[i]);
		const solveTypes = getSolveTypes(miss);

		let newMission = {
			name: miss.name,
			authors: miss.authors,
			bombs: bombs,
			topCompletion: miss.completions.length > 0 ? miss.completions[0] : null,
			dateAdded: miss.dateAdded,
			designedForTP: miss.designedForTP,
			factory: miss.factory,
			inGameId: miss.inGameId,
			inGameName: miss.inGameName,
			logfile: miss.logfile,
			notes: miss.notes,
			strikeMode: miss.strikeMode,
			timeMode: miss.timeMode,
			tpSolve: miss.tpSolve,
			variant: miss.variant,
			teamSolve: solveTypes.normalSolve,
			efmSolve: solveTypes.efmSolve,
			soloSolve: solveTypes.soloSolve
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
				steamID: miss.missionPack?.steamId ?? ''
			};
			minimize(p);
			missionPacks.push(p);
		}
	});

	missionPacks.sort((a, b) => dateAddedSort(a, b));
	let finalPacks: any[] = [];
	for (let p = 0; p < missionPacks.length; p++) {
		finalPacks.push(missionPacks[p]);
		delete finalPacks[finalPacks.length - 1].id;
	}

	return new Response(JSON.stringify(finalPacks));
}
