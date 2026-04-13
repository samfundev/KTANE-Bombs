import { query } from '$app/server';
import { getCurrentSeason } from './season';

export const getCurrentSeasonName = query(async () => {
	const currentSeason = await getCurrentSeason();
	return currentSeason?.name ?? '';
});
