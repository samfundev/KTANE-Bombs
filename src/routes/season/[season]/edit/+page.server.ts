import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import { Permission, type ID } from '$lib/types';
import { forbidden, hasPermission, onlyUnique, properUrlEncode } from '$lib/util';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { MISSION_UPDATE } from '$lib/const';
import type { SeasonWinners } from './_types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	if (!hasPermission(locals.user, Permission.ManageSeasons)) {
		throw forbidden(locals);
	}

	const { season } = params;
	const seasonResult = await client.season.findFirst({
		where: {
			name: season
		},
		select: {
			id: true,
			name: true,
			start: true,
			missionsStart: true,
			missionsEnd: true,
			end: true,
			notes: true,
			includeList: true,
			excludeList: true,
			winners: true,
			completions: {
				select: {
					team: true
				}
			}
		}
	});

	if (seasonResult === null) {
		throw error(404, 'Season not found.');
	}

	const seasons = await client.season.findMany({
		select: {
			name: true
		},
		orderBy: { id: 'asc' }
	});

	const missions = await client.mission.findMany({
		select: {
			id: true,
			name: true,
			verified: true
		},
		orderBy: { name: 'asc' }
	});
	let missionList = await client.mission.findMany({
		where: {
			dateAdded: {
				gte: seasonResult.missionsStart,
				lte: seasonResult.missionsEnd
			}
		},
		select: {
			id: true,
			name: true,
			verified: true
		},
		orderBy: { dateAdded: 'asc' }
	});

	return {
		season: seasonResult,
		seasonNames: seasons.map(s => s.name.toUpperCase()).filter(n => n !== seasonResult.name.toUpperCase()),
		names: seasonResult.completions.flatMap(c => c.team).filter(onlyUnique).sort((a, b) => a.localeCompare(b)),
		missions: missions.filter(m => !m.name.includes(MISSION_UPDATE)),
		missionList: missionList.filter(m => !m.name.includes(MISSION_UPDATE))
	};
};

export const actions: Actions = {
	deleteSeason: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.ManageSeasons)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const season = JSON.parse(fData.get('season')?.toString() ?? '');

		await auditClient.season.delete({
			where: {
				name: season.name
			}
		});

		throw redirect(303, '/season');
	},

	editSeason: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.ManageSeasons)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const season: ID<SeasonWinners> = JSON.parse(fData.get('season')?.toString() ?? '');

		await auditClient.season.update({
			where: {
				id: season.id
			},
			data: {
				name: season.name,
				start: season.start,
				end: season.end,
				missionsStart: season.missionsStart,
				missionsEnd: season.missionsEnd,
				notes: season.notes,
				includeList: season.includeList,
				excludeList: season.excludeList,
				winners: season.winners
			}
		});

		throw redirect(303, '/season/' + properUrlEncode(season.name));
	}
};
