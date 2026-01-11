import { readFileSync } from 'fs';
import client from '../src/lib/client';

(async function () {
	let data = JSON.parse(readFileSync('advanced.json').toString());
	let logs = data.AuditLog;
	let users = data.User;
	let seasons = data.Season;

	console.log('Creating users');
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

	//uncomment to wipe out your local audit log first
	//await client.auditLog.deleteMany({});

	console.log('Creating audit logs');
	logs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	await client.$transaction(
		async tx => {
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
				await tx.auditLog.create({
					data: logData
				});
			}
		},
		{ timeout: 120000 }
	);

	console.log('Updating seasons');
	const missions = await client.mission.findMany({
		select: {
			id: true,
			name: true
		}
	});
	let seasonQueries = [];
	seasons.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	for (const season of seasons) {
		let seasonData = {
			// omit id
			name: season.name,
			start: season.start,
			end: season.end,
			missionsStart: season.missionsStart,
			missionsEnd: season.missionsEnd,
			notes: season.notes,
			whitelist: season.whitelistNames.map(name => {
				const mission = missions.find(m => m.name === name);
				return mission ? mission.id : null;
			}).filter(id => id !== null)
		};
		seasonQueries.push(
			client.season.upsert({
				create: seasonData,
				update: seasonData,
				where: {
					name: seasonData.name
				}
			})
		);
	}
	await client.$transaction(seasonQueries);
})();
