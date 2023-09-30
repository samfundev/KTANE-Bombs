import client from '$lib/client';
import { TP_TEAM } from '$lib/const';
import { Permission } from '$lib/types';
import { fixPools, forbidden, hasPermission } from '$lib/util';
import type { Completion, Mission } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const load = async function ({ parent, params }: any) {
	const { user } = await parent(); //logged-in user
	const tp = params.user === TP_TEAM;
	const shownUser = await client.user.findFirst({
		where: {
			username: params.user
		},
		select: {
			avatar: true,
			username: true,
			permissions: true
		}
	});

	const completions = await client.completion.findMany({
		select: {
			team: true,
			solo: true,
			dateAdded: true,
			first: true,
			mission: {
				select: {
					name: true,
					id: true,
					variant: true
				}
			}
		},
		where: {
			team: { has: params.user },
			verified: true
		}
	});
	if (!tp && shownUser === null && completions.length === 0) {
		throw error(404);
	}

	const bestTimes = await client.mission.findMany({
		select: {
			completions: {
				select: {
					team: true,
					solo: true,
					dateAdded: true,
					first: true,
					time: true
				},
				where: {
					team: { has: params.user },
					verified: true
				},
				orderBy: { time: 'asc' },
				take: 1
			},
			name: true,
			id: true
		}
	});
	let unverifSolves: any[] | null = null;
	let unverifMissions: any[] | null = null;
	let unverifPacks: any[] | null = null;
	if (user !== null && user.username === params.user) {
		unverifSolves = await client.completion.findMany({
			where: {
				verified: false,
				team: { has: params.user }
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
			},
			orderBy: { dateAdded: 'desc' }
		});
		if (unverifSolves != null && unverifSolves.length < 1) unverifSolves = null;

		unverifMissions = await client.mission.findMany({
			where: {
				verified: false,
				uploadedBy: user.id
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
				dateAdded: true
			},
			orderBy: { dateAdded: 'desc' }
		});
		if (unverifMissions != null && unverifMissions.length < 1) unverifMissions = null;

		unverifPacks = await client.missionPack.findMany({
			where: {
				verified: false,
				uploadedBy: user.id
			},
			orderBy: { dateAdded: 'desc' }
		});
		if (unverifPacks != null && unverifPacks.length < 1) unverifPacks = null;
	}

	let completer = {
		distinct: new Set(),
		defuser: new Set(),
		defuserOnly: new Set(),
		expert: new Set(),
		efm: new Set(),
		solo: new Set()
	};
	let tpMissions: Pick<Mission, 'name' | 'variant' | 'tpSolve' | 'id'>[] = [];
	if (tp) {
		tpMissions = await client.mission.findMany({
			select: {
				name: true,
				variant: true,
				tpSolve: true,
				id: true
			},
			where: {
				tpSolve: true,
				verified: true
			}
		});
		for (const miss of tpMissions) {
			const missionKey = miss.variant !== null ? `v${miss.variant}` : `i${miss.id}`;
			completer.efm.add(missionKey);
			completer.distinct.add(missionKey);
		}
	} else {
		for (const completion of completions) {
			for (const [index, name] of completion.team.entries()) {
				if (name == params.user) {
					const mission = completion.mission;
					const missionKey = mission.variant !== null ? `v${mission.variant}` : `i${mission.id}`;
					if (completion.team.length === 1 && !completion.solo) {
						completer.efm.add(missionKey);
					} else if (index === 0) {
						completer.defuser.add(missionKey);
						if (completion.team.length === 1 && completion.solo) completer.solo.add(missionKey);
						else completer.defuserOnly.add(missionKey);
					} else {
						completer.expert.add(missionKey);
					}

					completer.distinct.add(missionKey);
				}
			}
		}
	}
	return {
		username: params.user,
		shownUser,
		completions,
		tpMissions,
		unverifSolves,
		unverifMissions:
			unverifMissions === null
				? null
				: unverifMissions.map(miss => {
						return {
							...fixPools(miss),
							completions: [],
							tpSolve: false
						};
				  }),
		unverifPacks,
		bestTimes: bestTimes.filter(miss => miss.completions.length > 0 && miss.completions[0].team.includes(params.user)),
		stats: {
			distinct: completer.distinct.size,
			defuser: completer.defuser.size,
			defuserOnly: completer.defuserOnly.size,
			expert: completer.expert.size,
			efm: completer.efm.size,
			solo: completer.solo.size
		}
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	editPermissions: async ({ locals, request }: any) => {
		if (!hasPermission(locals.user, Permission.ModifyPermissions)) {
			return forbidden(locals);
		}
		const fData = await request.formData();
		const body: Permission[] = JSON.parse(fData.get('perms')?.toString() ?? '');
		const user = fData.get('user')?.toString();
		if (user === null || user === undefined) {
			throw error(400);
		}
		await client.user.update({
			where: {
				id: user
			},
			data: {
				permissions: body
			}
		});

		return {};
	}
};
