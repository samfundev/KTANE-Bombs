import client from '$lib/client';
import { TP_TEAM } from '$lib/const';
import { Permission, type Completer } from '$lib/types';
import { Actions, error, redirect, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	const { season } = params;
	const seasonResult = await client.season.findFirst({
		where: {
			name: season
		},
		select: {
			id: true,
			name: true,
			start: true,
			end: true,
			notes: true,
			completions: {
				select: {
					mission: {
						select: {
							id: true,
							variant: true
						}
					},
					team: true,
					solo: true,
					seasonId: true
				},
				where: {
					verified: true
				}
			}
		}
	});

	if (seasonResult === null) {
		throw error(404, 'Season not found.');
	}

	const completersMap: Map<
		string,
		{ distinct: Set<string>; defuser: Set<string>; expert: Set<string>; efm: Set<string> }
	> = new Map();
	for (const completion of seasonResult.completions) {
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

	function total(completer: Completer) {
		return completer.defuser + completer.expert + completer.efm;
	}

	const sortedCompleters = Object.values(completers);
	sortedCompleters.sort((a, b) => {
		const distinct = b.distinct - a.distinct;
		const totalDiff = total(b) - total(a);
		if (distinct !== 0) return distinct;
		if (totalDiff !== 0) return totalDiff;
		return a.name.localeCompare(b.name);
	});
	// console.log(sortedCompleters);

	return {
		seasonCompleters: sortedCompleters,
		season: seasonResult
	};
};
