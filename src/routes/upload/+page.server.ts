import client from '$lib/client';
import { excludeArticleSort, onlyUnique, withoutArticle } from '$lib/util';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	const missions = await client.mission.findMany({
		select: {
			name: true,
			completions: true,
			authors: true,
			factory: true
		},
		where: {
			verified: true
		}
	});

	const packs = await client.missionPack.findMany({
		select: {
			id: true,
			name: true
		}
	});

	return {
		factoryStatus: missions.reduce((result: any, current) => {
			result[current.name] = current.factory;
			return result;
		}, {}),
		missionNames: missions.map(mission => mission.name).sort(excludeArticleSort),
		authorNames: missions
			.map(mission => mission.authors)
			.flat()
			.filter(onlyUnique)
			.sort(),
		solverNames: missions
			.map(mission => mission.completions.map(comp => comp.team))
			.flat(2)
			.filter(onlyUnique)
			.sort(),
		packs: packs.sort((a, b) => {
			return withoutArticle(a.name).localeCompare(withoutArticle(b.name));
		})
	};
};
