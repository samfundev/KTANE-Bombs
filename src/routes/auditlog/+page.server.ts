import client from '$lib/client';
import { UNKNOWN_ITEM } from '$lib/const';
import { Permission } from '$lib/types';
import { forbidden, hasAnyPermission } from '$lib/util';

async function findName(log: any) {
	let info = { linkable: true, mission: null };
	if (log.model === 'Completion') {
		const comp = await client.completion.findUnique({
			where: { id: parseInt(log.recordId) },
			select: {
				team: true,
				mission: { select: { name: true } }
			}
		});
		if (comp != null) {
			return { ...info, name: comp.team.join(', '), mission: comp.mission.name };
		}
	} else if (log.model === 'User') {
		const fetched = await client.user.findUnique({
			where: { id: log.recordId },
			select: { username: true }
		});
		if (fetched != null) {
			return { ...info, name: fetched.username };
		}
	} else if (log.model === 'Mission') {
		const mission = await client.mission.findUnique({
			where: { id: parseInt(log.recordId) },
			select: { name: true }
		});
		if (mission != null) {
			return { ...info, name: mission.name };
		}
	} else if (log.model === 'MissionPack') {
		const pack = await client.missionPack.findUnique({
			where: { id: parseInt(log.recordId) },
			select: { name: true }
		});
		if (pack != null) {
			return { ...info, name: pack.name };
		}
	}
	return { ...info, linkable: false, name: log.name };
}

export const load = async function ({ parent, locals }: any) {
	const { user } = await parent();
	if (!hasAnyPermission(user, Permission.VerifyMission, Permission.VerifyCompletion, Permission.VerifyMissionPack)) {
		throw forbidden(locals);
	}

	const everything = await client.auditLog.findMany({
		orderBy: { id: 'desc' }
	});

	let logs: any[] = [];
	for (let i = 0; i < everything.length; i++) {
		let nameInfo = await findName(everything[i]);
		let log = {
			...everything[i],
			name: nameInfo.name,
			linkable: nameInfo.linkable,
			mission: nameInfo.mission
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
		logs
	};
};
