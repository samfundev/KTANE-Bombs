import client from '$lib/client';
import { getData } from '$lib/repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			authors: true,
			bombs: true,
			designedForTP: true,
			tpSolve: true,
			factory: true,
			completions: {
				where: { verified: true }
			}
		}
	});

	return {
		missions,
		modules: await getData()
	};
};
