import client from '$lib/client';
import { getData } from '$lib/repo';
import { allSpecialModules, getModule } from '$lib/util';

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
	const modules = (await getData()) ?? {};
	allSpecialModules.forEach(mod => {
		modules[mod] = getModule(mod, modules);
	});
	return {
		missions,
		modules
	};
};
