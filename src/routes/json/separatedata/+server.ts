import client from '$lib/client';
import { Permission, Season } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { minimize } from '../_util';
import type { AuditLog, User } from '@prisma/client';

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

	const seasonResults = await client.season.findMany({
		orderBy: { id: 'asc' },
		select: {
			id: true,
			name: true,
			start: true,
			end: true,
			notes: true
		}
	});

	let logs: { AuditLog: AuditLog[]; User: User[]; Season: Season[] } = {
		AuditLog: [],
		User: [],
		Season: []
	};
	logResults.forEach(log => {
		let newLog = JSON.parse(JSON.stringify(log));
		minimize(newLog);
		logs.AuditLog.push(newLog);
	});
	userResults.forEach(log => {
		let newUser = JSON.parse(JSON.stringify(log));
		minimize(newUser);
		logs.User.push(newUser);
	});
	seasonResults.forEach(log => {
		let newSeason = JSON.parse(JSON.stringify(log));
		minimize(newSeason);
		logs.Season.push(newSeason);
	});

	return new Response(JSON.stringify(logs));
};
