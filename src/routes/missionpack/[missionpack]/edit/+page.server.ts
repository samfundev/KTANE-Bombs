import client from '$lib/client';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect, error } from '@sveltejs/kit';
import type { EditMissionPack } from '../../_types';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	if (!hasPermission(locals.user, Permission.VerifyMissionPack)) {
		throw forbidden(locals);
	}

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
						where: { verified: true }
					}
				}
			},
			steamId: true,
			name: true,
			verified: true,
			id: true
		}
	});

	if (pack === null) {
		throw error(404, 'Mission pack not found.');
	}

	return { pack };
};

export const actions: Actions = {
	deleteMissionPack: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMissionPack)) {
			throw forbidden(locals);
		}
		const fData = await request.formData();
		const pack = JSON.parse(fData.get('pack')?.toString() ?? '');

		await client.missionPack.delete({
			where: {
				name: pack.name
			}
		});

		throw redirect(303, '/');
	},

	editMissionPack: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMissionPack)) {
			throw forbidden(locals);
		}

		const fData = await request.formData();
		const pack: EditMissionPack = JSON.parse(fData.get('pack')?.toString() ?? '');

		await client.missionPack.update({
			where: {
				id: pack.id
			},
			data: {
				steamId: pack.steamId,
				name: pack.name
			}
		});

		throw redirect(303, '/missionpack/' + encodeURIComponent(pack.name));
	}
};
