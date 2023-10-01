import client from '$lib/client';
import { withoutArticle } from '$lib/util';

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
				return {
					name: m.name,
					authors: m.authors,
					bombs: m.bombs,
					missionId: m.inGameId,
					designedForTP: m.designedForTP,
					tpSolve: m.tpSolve,
					completions: m.completions.length
				};
			})
			.sort((a, b) => {
				return withoutArticle(a.name).localeCompare(withoutArticle(b.name));
			})
	);

	return new Response(result);
}
