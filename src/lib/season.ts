// These function are to be run on the server ONLY
import client from '$lib/client';
import type { CurrentSeason } from './types';

export async function getSeasonWinners(): Promise<string[]> {
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
}

export async function getCurrentSeason(): Promise<CurrentSeason | null> {
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
}
