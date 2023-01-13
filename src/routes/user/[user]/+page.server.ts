import client from '$lib/client';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { Mission } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const load = async function ({ params }: any) {
	const tp = params.user === 'Twitch Plays';
	const user = await client.user.findFirst({
		where: {
			username: params.user
		},
		select: {
			id: true,
			avatar: true,
			username: true,
			permissions: true
		}
	});

	const completions = await client.completion.findMany({
		select: {
			team: true,
			solo: true,
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
	if (!tp && user === null && completions.length === 0) {
		throw error(404);
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
		shownUser: user,
		completions,
		tpMissions,
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
