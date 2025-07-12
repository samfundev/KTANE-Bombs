import client from '$lib/client';
import { getData } from '$lib/repo';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	const { mission } = params;
	const missionToUpdate = mission?.startsWith('[[UPDATE]]')
		? await client.mission.findFirst({
				where: {
					name: mission?.substring(11)
				},
				select: {
					name: true,
					completions: {
						where: { verified: true }
					},
					dateAdded: true,
					variant: true
				}
		  })
		: null;
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
			completions: missionToUpdate === null ? { where: { verified: true } } : false,
			designedForTP: true,
			tpSolve: true,
			factory: true,
			timeMode: true,
			strikeMode: true,
			variant: true,
			logfile: true,
			dateAdded: true,
			uploadedBy: true,
			inGameId: true,
			notes: true,
			missionPack: {
				select: {
					name: true,
					steamId: true
				}
			}
		}
	});

	if (missionResult === null) {
		error(404, 'Mission not found.');
	}
	let verify = hasPermission(locals.user, Permission.VerifyMission);
	if (!missionResult.verified && !verify) {
		throw forbidden(locals);
	}
	let uploadedBy = missionResult.uploadedBy;
	if (verify && uploadedBy) {
		const uploadUser = await client.user.findUnique({
			where: { id: uploadedBy },
			select: { username: true }
		});
		if (uploadUser !== null) uploadedBy = uploadUser.username;
	}

	const variantId = missionToUpdate === null ? missionResult.variant : missionToUpdate.variant;
	const variants =
		variantId == null
			? null
			: await client.mission.findMany({
					where: {
						variant: variantId,
						name: { not: missionToUpdate === null ? missionResult.name : missionToUpdate.name }
					},
					select: {
						name: true,
						completions: {
							where: { verified: true }
						},
						tpSolve: true
					}
			  });

	if (missionToUpdate !== null) {
		missionResult.completions = missionToUpdate.completions;
		missionResult.dateAdded = missionToUpdate.dateAdded;
	}

	return {
		mission: {
			...missionResult,
			uploadedBy: verify ? uploadedBy : null,
			inGameId: verify ? missionResult.inGameId : null,
			inGameName: null
		},
		variants,
		modules: await getData()
	};
};
