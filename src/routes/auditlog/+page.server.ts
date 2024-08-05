import client from '$lib/client';
import { Permission } from '$lib/types';
import { forbidden, hasAnyPermission } from '$lib/util';

export const load = async function ({ parent, locals }: any) {
	const { user } = await parent();
	if (!hasAnyPermission(user, Permission.VerifyMission, Permission.VerifyCompletion, Permission.VerifyMissionPack)) {
		throw forbidden(locals);
	}

	const everything = await client.auditLog.findMany({
		orderBy: { id: 'asc' }
	});

	let logs: any[] = [];
	for (let i = 0; i < everything.length; i++) {
		let log = {
			...everything[i],
			linkable: false,
			mission: null
		};
		if (log.userId != null) {
			const usr = await client.user.findUnique({
				where: { id: log.userId },
				select: { username: true }
			});
			if (usr !== null) {
				log.userId = usr.username;
			}
		}
		logs.push(log);
	}

	return {
		logs,
		fromUser: null,
		editMissions: null,
		newMissions: null,
		deleteMissions: null,
		editPacks: null,
		newPacks: null,
		deletePacks: null,
		editCompletions: null,
		newCompletions: null,
		deleteCompletions: null,
		editUsers: null,
		deleteUsers: null
	};
};
