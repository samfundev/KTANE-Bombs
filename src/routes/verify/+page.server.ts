import client from '$lib/client';
import type { CompletionQueueItem, MissionQueueItem, QueueItem } from '$lib/types';
import { Permission, type MissionPackQueueItem } from '$lib/types';
import { fixPools, forbidden, hasAnyPermission, hasPermission, onlyUnique } from '$lib/util';

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
					orderBy: {
						id: 'asc'
					}
				},
				designedForTP: true,
				factory: true,
				timeMode: true,
				strikeMode: true,
				logfile: true,
				missionPack: {
					select: {
						id: true,
						name: true
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
				.sort((a, b) => a.mission.id - b.mission.id)
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
				.sort((a, b) => a.completion.id - b.completion.id)
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
				.sort((a, b) => a.pack.id - b.pack.id)
		);
	}

	return {
		queue,
		solverNames
	};
};
