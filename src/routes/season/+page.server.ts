import client from '$lib/client';
import { getCurrentSeason } from '$lib/season';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async function () {
	const seasons = await client.season.findMany({
		select: {
			id: true,
			name: true,
			start: true,
			end: true,
			notes: true
		},
		orderBy: { start: 'desc' }
	});

	const currentSeason = await getCurrentSeason();
	const currentSeasonName = currentSeason?.name ?? '';

	return {
		seasons,
		currentSeasonName
	};
};
