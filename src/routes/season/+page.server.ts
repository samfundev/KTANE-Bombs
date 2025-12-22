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
		orderBy: { id: 'asc' }
	});

	return {
		seasons
	};
};
