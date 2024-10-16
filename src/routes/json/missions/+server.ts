import client from '$lib/client';
import { TP_TEAM } from '$lib/const';
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
			factory: true,
			logfile: true,
			strikeMode: true,
			timeMode: true,
			completions: {
				where: {
					AND: {
						NOT: {
							team: { has: TP_TEAM }
						},
						verified: true
					}
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
					factory: m.factory,
					logfile: m.logfile,
					strikeMode: m.strikeMode,
					timeMode: m.timeMode,
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
