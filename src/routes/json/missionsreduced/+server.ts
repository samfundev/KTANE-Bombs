import client from '$lib/client';
import { onlyUnique, withoutArticle } from '$lib/util';
import type { Mission } from '$lib/types.svelte';
import { minimize } from '../_util';

export async function GET() {
	const missionsObj = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			authors: true,
			bombs: true,
			inGameId: true,
			inGameName: true,
			designedForTP: true,
			tpSolve: true,
			completions: {
				where: {
					verified: true
				}
			}
		}
	});

	let missions: Mission[] = [];
	Object.assign(missions, missionsObj);

	let result = JSON.stringify(
		missions
			.map(m => {
				let list = m.bombs
					.map(b => b.pools.map(p => p.modules))
					.flat(2)
					.filter(onlyUnique);
				let reducedBombs = m.bombs.map(b => {
					return {
						modules: b.modules,
						strikes: b.strikes,
						widgets: b.widgets,
						time: b.time
					};
				});
				let mission = {
					name: m.name,
					authors: m.authors,
					bombs: reducedBombs,
					missionId: m.inGameId,
					inGameName: m.inGameName,
					designedForTP: m.designedForTP,
					moduleList: list,
					tpSolve: m.tpSolve,
					completions: m.completions.length
				};
				minimize(mission);
				return mission;
			})
			.sort((a, b) => {
				return withoutArticle(a.name).localeCompare(withoutArticle(b.name));
			})
	);

	return new Response(result);
}
