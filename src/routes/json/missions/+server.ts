import client from '$lib/client';
import { withoutArticle } from '$lib/util';
import { minimize } from '../_util';

export async function GET() {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			authors: true,
			bombs: true,
			inGameId: true,
			inGameName: true,
			tpSolve: true,
			designedForTP: true,
			completions: {
				where: {
					verified: true
				}
			}
		}
	});
	let result = JSON.stringify(
		missions
			.map(m => {
				let mission = {
					name: m.name,
					authors: m.authors,
					bombs: m.bombs,
					missionId: m.inGameId,
					inGameName: m.inGameName,
					designedForTP: m.designedForTP,
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
