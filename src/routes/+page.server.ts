import client from '$lib/client';
import { getData } from '$lib/repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			id: true,
			name: true,
			authors: true,
			bombs: true,
			designedForTP: true,
			tpSolve: true,
			factory: true,
			timeMode: true,
			strikeMode: true,
			dateAdded: true,
			completions: {
				where: { verified: true }
			}
		},
		orderBy: { dateAdded: 'desc' }
	});

	return {
		missions: missions.map(miss => {
			return { ...miss, logfile: null, notes: null, uploadedBy: null, inGameId: null, inGameName: null };
		}),
		modules: await getData()
	};
};
