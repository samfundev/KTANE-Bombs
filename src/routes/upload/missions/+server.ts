import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import { error, type RequestEvent } from '@sveltejs/kit';
import type { ReplaceableMission } from '../_types';
import { forbidden, getLogfileLinks } from '$lib/util';
import { MISSION_UPDATE } from '$lib/const';

export async function POST({ locals, request }: RequestEvent) {
	if (locals.user == null) {
		throw forbidden(locals);
	}

	const auditClient = createAuditClient(locals.user);

	const missions: ReplaceableMission[] = await request.json();
	if (missions.some(m => m.missionPack === null)) {
		error(400, 'Mission pack is required.');
	}

	let context = '';
	for (const mission of missions) {
		const missionName = (mission.replace ? MISSION_UPDATE : '') + mission.name;
		const equalMission = await client.mission.findUnique({
			where: {
				name: missionName
			},
			select: {
				name: true,
				verified: true
			}
		});
		if (equalMission !== null) {
			if (equalMission.verified === false)
				return new Response(`"${missionName}" is already in the queue for verfication.`, { status: 409 });
			else return new Response(`Duplicate mission "${missionName}" not uploaded.`, { status: 406 });
		}
		if (mission.replace) {
			if (!context.includes('R')) context += 'R';
		} else if (!context.includes('N')) context += 'N';

		// Fetch the logfile content to store in the database
		if (mission.logfile === null) error(400, 'Logfile is required.');

		const [fileUrl] = getLogfileLinks(mission.logfile);
		if (fileUrl.length === 0) error(400, 'Invalid logfile URL.');

		const res = await fetch(fileUrl);
		if (!res.ok) error(400, 'Failed to fetch logfile.');

		const logfileContent: string = await res.text();

		await auditClient.mission.create({
			data: {
				name: missionName,
				authors: mission.authors,
				bombs: {
					create: mission.bombs.map(bomb => {
						return {
							...bomb,
							pools: JSON.parse(JSON.stringify(bomb.pools))
						};
					})
				},
				factory: mission.factory,
				timeMode: mission.timeMode,
				strikeMode: mission.strikeMode,
				designedForTP: mission.designedForTP,
				missionPackId: mission.missionPack?.id,
				logfile: mission.logfile,
				dateAdded: mission.dateAdded,
				uploadedBy: locals.user.id,
				inGameId: mission.inGameId,
				verified: false,
				logfileContent
			}
		});
	}

	const text = [];
	for (let i = 0; i < context.length; i++) {
		const char = context[i];
		text.push(char == 'N' ? 'New Mission' : 'Mission UPDATE');
	}
	return new Response(`${text.join(' & ')} uploaded successfully!`);
}
