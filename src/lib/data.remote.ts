import client from '$lib/client';
import { query } from '$app/server';
import type { CurrentSeason } from './types';

export const getSeasonWinners = query(async () => {
	const now = new Date();
	const season = await client.season.findFirst({
		where: {
			end: { lte: now }
		},
		select: {
			winners: true
		},
		orderBy: {
			end: 'desc'
		}
	});

	return season?.winners ?? [];
});

export const getCurrentSeason = query(async (): Promise<CurrentSeason | null> => {
	const now = new Date();
	const currentSeason = await client.season.findFirst({
		where: {
			start: { lte: now },
			end: { gte: now }
		},
		select: {
			id: true,
			missionsStart: true,
			missionsEnd: true,
			includeList: true,
			excludeList: true,
			name: true
		},
		orderBy: { start: 'desc' }
	});
	return currentSeason;
});

export const getCurrentSeasonName = query(async () => {
	const currentSeason = await getCurrentSeason();
	return currentSeason?.name ?? '';
});
