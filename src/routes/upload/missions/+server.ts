import client from '$lib/client';
import { error, type RequestEvent } from '@sveltejs/kit';
import type { ReplaceableMission } from '../_types';

export async function POST({ request }: RequestEvent) {
	const missions: ReplaceableMission[] = await request.json();
	if (missions.some(m => m.missionPack === null)) {
		throw error(400, 'Mission pack is required');
	}

	for (const mission of missions) {
		await client.mission.create({
			data: {
				name: (mission.replace ? '[[UPDATE]] ' : '') + mission.name,
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
				verified: false
			}
		});
	}

	return new Response(undefined);
}
