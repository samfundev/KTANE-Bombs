import client from '$lib/client';
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

	const now = new Date();
	const currentSeason = await client.season.findFirst({
		where: {
			start: { lte: now },
			end: { gte: now }
		},
		select: {
			name: true
		},
		orderBy: { start: 'desc' }
	});
	const currentSeasonName = currentSeason?.name ?? '';

	return {
		seasons,
		currentSeasonName
	};
};
