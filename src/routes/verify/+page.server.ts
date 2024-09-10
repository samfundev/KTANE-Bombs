import client from '$lib/client';
import type { CompletionQueueItem, MissionQueueItem, QueueItem } from '$lib/types';
import { Permission, type MissionPackQueueItem } from '$lib/types';
import { dateAddedSort, fixPools, forbidden, hasAnyPermission, hasPermission, onlyUnique } from '$lib/util';

export const load = async function ({ parent, locals }: any) {
	const { user } = await parent();
	if (!hasAnyPermission(user, Permission.VerifyMission, Permission.VerifyCompletion, Permission.VerifyMissionPack)) {
		throw forbidden(locals);
	}

	const queue: QueueItem[] = [];

	// Missions
	if (hasPermission(user, Permission.VerifyMission)) {
		const missions = await client.mission.findMany({
			where: {
				verified: false
			},
			select: {
				id: true,
				name: true,
				authors: true,
				bombs: {
					orderBy: { id: 'asc' }
				},
				designedForTP: true,
				factory: true,
				timeMode: true,
				strikeMode: true,
				logfile: true,
				dateAdded: true,
				notes: true,
				uploadedBy: true,
				inGameId: true,
				missionPack: {
					select: {
						id: true,
						name: true,
						dateAdded: true
					}
				}
			}
		});

		queue.push(
			...missions
				.map(mission => {
					return {
						type: 'mission',
						mission: {
							...fixPools(mission),
							completions: [],
							tpSolve: false
						}
					} as MissionQueueItem;
				})
				.sort((a, b) => dateAddedSort(a.mission, b.mission))
		);
	}

	const vMissions = await client.mission.findMany({
		select: {
			completions: {
				where: {
					verified: true
				}
			}
		},
		where: {
			verified: true
		}
	});
	let solverNames: string[] = [];

	// Completions
	if (hasPermission(user, Permission.VerifyCompletion)) {
		const completions = await client.completion.findMany({
			where: {
				verified: false
			},
			include: {
				mission: {
					include: {
						bombs: true,
						completions: {
							where: { verified: true }
						}
					}
				}
			}
		});
		for (let c = 0; c < completions.length; c++) {
			let comp = completions[c];
			if (comp.uploadedBy != null) {
				const usr = await client.user.findUnique({
					where: { id: comp.uploadedBy },
					select: { username: true }
				});
				if (usr !== null) {
					comp.uploadedBy = usr.username;
					continue;
				}
			}
			comp.uploadedBy = 'Unknown';
		}

		solverNames = vMissions
			.map(mission => mission.completions.map(comp => comp.team))
			.flat(2)
			.filter(onlyUnique);

		queue.push(
			...completions
				.map(completion => {
					return {
						type: 'completion',
						completion,
						mission: fixPools(completion.mission)
					} as CompletionQueueItem;
				})
				.sort((a, b) => dateAddedSort(a.completion, b.completion))
		);
	}

	// Mission Pack
	if (hasPermission(user, Permission.VerifyMissionPack)) {
		const missionPacks = await client.missionPack.findMany({
			where: {
				verified: false
			}
		});

		queue.push(
			...missionPacks
				.map(pack => {
					return {
						type: 'missionpack',
						pack
					} as MissionPackQueueItem;
				})
				.sort((a, b) => dateAddedSort(a.pack, b.pack))
		);
	}

	return {
		queue,
		solverNames
	};
};
