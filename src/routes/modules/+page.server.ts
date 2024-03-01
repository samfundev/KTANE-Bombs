import client from '$lib/client';
import { getData } from '$lib/repo';

export const load = async function () {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			bombs: true
		}
	});
	return {
		missions,
		modules: (await getData()) ?? {}
	};
};
