import client from '$lib/client';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	const { missionpack } = params;
	const pack = await client.missionPack.findFirst({
		where: {
			name: missionpack
		},
		select: {
			missions: {
				orderBy: { name: 'asc' },
				where: { verified: true },
				select: {
					name: true,
					authors: true,
					bombs: true,
					designedForTP: true,
					tpSolve: true,
					factory: true,
					timeMode: true,
					strikeMode: true,
					completions: {
						where: {
							verified: true
						}
					}
				}
			},
			steamId: true,
			name: true,
			dateAdded: true,
			verified: true
		}
	});

	if (pack === null) {
		throw error(404, 'Mission pack not found.');
	}

	if (!pack.verified && !hasPermission(locals.user, Permission.VerifyMissionPack)) {
		throw forbidden(locals);
	}

	return { pack };
};
