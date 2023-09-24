import client from '$lib/client';
import { error, type RequestEvent } from '@sveltejs/kit';
import type { ReplaceableMission } from '../_types';
import { forbidden } from '$lib/util';

export async function POST({ locals, request }: RequestEvent) {
	if (locals.user == null) {
		throw forbidden(locals);
	}
	const missions: ReplaceableMission[] = await request.json();
	if (missions.some(m => m.missionPack === null)) {
		throw error(400, 'Mission pack is required.');
	}

	let context = '';
	for (const mission of missions) {
		let missionName = (mission.replace ? '[[UPDATE]] ' : '') + mission.name;
		let equalMission = await client.mission.findUnique({
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

		await client.mission.create({
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
				verified: false
			}
		});
	}

	let text = [];
	for (let i = 0; i < context.length; i++) {
		const char = context[i];
		text.push(char == 'N' ? 'New Mission' : 'Mission UPDATE');
	}
	return new Response(`${text.join(' & ')} uploaded successfully!`);
}
