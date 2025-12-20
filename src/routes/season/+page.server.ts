import client from '$lib/client';
import { TP_TEAM } from '$lib/const';
import type { Completer } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	const seasons = await client.seasons.findMany({
		orderBy: { id: 'asc' }
	});

	const currentSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;

	const completions = await client.completion.findMany({
		select: {
			mission: {
				select: {
					id: true,
					variant: true
				}
			},
			team: true,
			solo: true,
			season: true
		},
		where: {
			verified: true,
			NOT: {
				team: { has: TP_TEAM }
			}
		}
	});

	const completionsBySeason = new Map<string, typeof completions>();

	for (const completion of completions) {
		if (completion.season) {
			const seasonCompletions = completionsBySeason.get(completion.season) || [];
			seasonCompletions.push(completion);
			completionsBySeason.set(completion.season, seasonCompletions);
		}
	}

	const seasonCompleters = new Map<string, Completer[]>();

	for (const [seasonName, seasonCompletions] of completionsBySeason) {
		const completersMap = new Map<string,
			{ distinct: Set<string>; defuser: Set<string>; expert: Set<string>; efm: Set<string> }>();

		for (const completion of seasonCompletions) {
			for (const [index, name] of completion.team.entries()) {
				let completer = completersMap.get(name);
				if (completer === undefined) {
					completer = {
						distinct: new Set(),
						defuser: new Set(),
						expert: new Set(),
						efm: new Set()
					};
					completersMap.set(name, completer);
				}

				const mission = completion.mission;
				const missionKey = mission.variant !== null ? `v${mission.variant}` : `i${mission.id}`;
				if (completion.team.length === 1 && !completion.solo) {
					completer.efm.add(missionKey);
				} else if (index === 0) {
					completer.defuser.add(missionKey);
				} else {
					completer.expert.add(missionKey);
				}

				completer.distinct.add(missionKey);
			}
		}

		const completers: Completer[] = [...completersMap.entries()].map(([name, completer]) => ({
			name,
			distinct: completer.distinct.size,
			defuser: completer.defuser.size,
			expert: completer.expert.size,
			efm: completer.efm.size
		}));

		const sortedCompleters = Object.values(completers);
		sortedCompleters.sort((a, b) => {
			const distinct = b.distinct - a.distinct;
			const totalDiff = total(b) - total(a);
			if (distinct !== 0) return distinct;
			if (totalDiff !== 0) return totalDiff;
			return a.name.localeCompare(b.name);
		});

		seasonCompleters.set(seasonName, sortedCompleters);
	}

	const allSeasons = await client.seasons.findMany({
		orderBy: { id: 'asc' }
	});

	function total(completer: Completer) {
		return completer.defuser + completer.expert + completer.efm;
	}

	return {
		seasonCompleters: Object.fromEntries(seasonCompleters),
		seasons: allSeasons,
		currentSeason: currentSeason
	};
};
