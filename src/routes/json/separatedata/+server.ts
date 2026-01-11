import client from '$lib/client';
import { Permission, Season } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { minimize } from '../_util';
import type { AuditLog, User } from '$lib/generated/prisma/client';

export const GET: RequestHandler = async function ({ locals }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.DownloadDatabase)) {
		throw forbidden(locals);
	}
	const logResults = await client.auditLog.findMany({
		orderBy: { id: 'asc' }
	});

	const userResults = await client.user.findMany({
		orderBy: { id: 'asc' },
		select: {
			id: true,
			username: true,
			discordName: true,
			avatar: true,
			permissions: true
		}
	});

	let seasonResults = await client.season.findMany({
		orderBy: { id: 'asc' },
		select: {
			id: true,
			name: true,
			start: true,
			end: true,
			missionsStart: true,
			missionsEnd: true,
			notes: true,
			whitelist: true
		}
	});

	const missions = await client.mission.findMany({
		select: {
			id: true,
			name: true
		}
	});
	let seasons = seasonResults.map(s => {
		const names = s.whitelist.map(missionId => {
			const mission = missions.find(m => m.id === missionId);
			return mission ? mission.name : `Unknown Mission (${missionId})`;
		});
		return {
			...s,
			whitelist: undefined,
			whitelistNames: names
		};
	});

	const logs: { AuditLog: AuditLog[]; User: User[]; Season: Season[] } = {
		AuditLog: [],
		User: [],
		Season: []
	};
	logResults.forEach(log => {
		const newLog = JSON.parse(JSON.stringify(log));
		minimize(newLog);
		logs.AuditLog.push(newLog);
	});
	userResults.forEach(user => {
		const newUser = JSON.parse(JSON.stringify(user));
		minimize(newUser);
		logs.User.push(newUser);
	});
	seasons.forEach(season => {
		const newSeason = JSON.parse(JSON.stringify(season));
		minimize(newSeason);
		logs.Season.push(newSeason);
	});

	return new Response(JSON.stringify(logs));
};
