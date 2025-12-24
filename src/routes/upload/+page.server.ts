import client from '$lib/client';
import { onlyUnique, withoutArticle } from '$lib/util';
import { redirect } from '@sveltejs/kit';

export const load = async function ({ parent }: any) {
	const { user } = await parent();
	if (user == null) {
		throw redirect(302, '/login');
	}
	const missions = await client.mission.findMany({
		select: {
			name: true,
			completions: true,
			authors: true,
			factory: true,
			timeMode: true,
			inGameName: true,
			bombs: {
				select: { time: true }
			}
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

	let infoInit: { [name: string]: any } = {};

	const now = new Date();
	const currentSeason = await client.season.findFirst({
		where: {
			start: { lte: now },
			end: { gte: now }
		},
		select: {
			id: true
		},
		orderBy: {
			id: 'desc'
		}
	});
	const currentSeasonId = currentSeason?.id ?? null;

	return {
		missionInfo: missions.reduce((info: { [name: string]: any }, miss: any) => {
			info[miss.name] = {};
			info[miss.name]['ingame'] = miss.inGameName;
			info[miss.name]['factory'] = miss.factory;
			info[miss.name]['timeMode'] = miss.timeMode;
			info[miss.name]['time'] =
				miss.timeMode === 'Global'
					? Math.max(miss.bombs.map((bomb: any) => bomb.time))
					: miss.bombs.map((bomb: any) => bomb.time).reduce((a: number, b: number) => a + b, 0);
			return info;
		}, infoInit),
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
		}),
		currentSeasonId
	};
};
