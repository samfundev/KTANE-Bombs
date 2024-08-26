import client from '$lib/client';
import { Bomb, Permission } from '$lib/types';
import { dateAddedSort, forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { minimize } from '../_util';
import { AuditLog, User } from '@prisma/client';

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

	let logs: { AuditLog: AuditLog[]; User: User[] } = {
		AuditLog: [],
		User: []
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

	return new Response(JSON.stringify(logs));
};
