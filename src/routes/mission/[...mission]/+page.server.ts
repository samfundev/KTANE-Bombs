import client from '$lib/client';
import { getData } from '$lib/repo';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	const { mission } = params;
	const missionResult = await client.mission.findFirst({
		where: {
			name: mission
		},
		select: {
			name: true,
			authors: true,
			verified: true,
			bombs: {
				orderBy: { id: 'asc' }
			},
			completions: {
				where: { verified: true }
			},
			designedForTP: true,
			tpSolve: true,
			factory: true,
			timeMode: true,
			strikeMode: true,
			variant: true,
			logfile: true,
			dateAdded: true,
			missionPack: {
				select: {
					name: true,
					steamId: true
				}
			}
		}
	});

	if (missionResult === null) {
		throw error(404, 'Mission not found.');
	}

	const variantId = missionResult.variant;
	const variants =
		variantId == null
			? null
			: await client.mission.findMany({
					where: {
						variant: variantId,
						name: { not: missionResult.name }
					},
					select: {
						name: true,
						completions: {
							where: { verified: true }
						},
						tpSolve: true
					}
			  });

	if (!missionResult.verified && !hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	return {
		mission: missionResult,
		variants,
		modules: await getData()
	};
};
