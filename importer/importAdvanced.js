import { readFileSync } from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

(async function () {
	const client = new PrismaClient();

	let data = JSON.parse(readFileSync('advanced.json').toString());
	let logs = data.AuditLog;
	let users = data.User;

	let userQueries = [];
	users.sort((a, b) => a.id.localeCompare(b.id));
	for (const user of users) {
		let userData = {
			username: user.username,
			discordName: user.discordName,
			avatar: user.avatar,
			permissions: user.permissions
		};
		userQueries.push(
			client.user.upsert({
				create: {
					...userData,
					id: user.id,
					accessToken: '',
					refreshToken: ''
				},
				update: userData,
				where: {
					id: user.id
				}
			})
		);
	}
	await client.$transaction(userQueries);

	await client.auditLog.deleteMany({});
	let logQueries = [];
	logs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	for (const log of logs) {
		const user = await client.user.findFirst({
			where: { id: log.userId },
			select: { id: true }
		});
		let logData = {
			model: log.model,
			recordId: log.recordId,
			name: log.name,
			action: log.action,
			timestamp: log.timestamp,
			before: log.before,
			after: log.after
		};
		if (user) logData.userId = log.userId;
		logQueries.push(
			client.auditLog.create({
				data: logData
			})
		);
	}
	await client.$transaction(logQueries);
})();
