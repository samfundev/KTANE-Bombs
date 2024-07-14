import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import { getData } from '$lib/repo';
import { Completion, Permission, type ID } from '$lib/types';
import { excludeArticleSort, forbidden, hasPermission, properUrlEncode } from '$lib/util';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { EditMission } from './_types';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async function ({ params, locals }: ServerLoadEvent) {
	if (!hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	const { mission } = params;
	const missionResult = await client.mission.findFirst({
		where: {
			name: mission
		},
		select: {
			id: true,
			name: true,
			authors: true,
			verified: true,
			bombs: {
				orderBy: { id: 'asc' }
			},
			completions: {
				where: { verified: true },
				select: client.$exclude('completion', ['missionId'])
			},
			designedForTP: true,
			tpSolve: true,
			factory: true,
			timeMode: true,
			strikeMode: true,
			variant: true,
			logfile: true,
			dateAdded: true,
			notes: true,
			inGameId: true,
			inGameName: true,
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

	const packs = await client.missionPack.findMany({
		select: {
			name: true,
			id: true
		}
	});

	const missions = await client.mission.findMany({
		where: {
			NOT: { name: mission }
		},
		select: {
			name: true
		}
	});

	const firstVariant = await client.mission.findFirst({
		where: {
			variant: missionResult.variant ?? -1,
			NOT: { id: missionResult.id }
		},
		select: {
			name: true
		}
	});

	return {
		mission: {
			...missionResult,
			variantOf: firstVariant?.name ?? '',
			uploadedBy: null
		},
		missionNames: missions.map(m => m.name).sort(excludeArticleSort),
		packs,
		modules: await getData()
	};
};

export const actions: Actions = {
	deleteMission: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMission)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user)

		const fData = await request.formData();
		const mission = JSON.parse(fData.get('mission')?.toString() ?? '');

		await auditClient.mission.delete({
			where: {
				name: mission.name
			}
		});

		throw redirect(303, '/');
	},
	deleteCompletion: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyCompletion)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user)

		const fData = await request.formData();
		const completion: ID<Completion> = JSON.parse(fData.get('completion')?.toString() ?? '');

		await auditClient.completion.delete({
			where: {
				id: completion.id
			}
		});

		return {};
	},
	editMission: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMission)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user)

		const fData = await request.formData();
		const mission: EditMission = JSON.parse(fData.get('mission')?.toString() ?? '');
		const variantEdit: boolean = JSON.parse(fData.get('variantEdit')?.toString() ?? '');

		if (variantEdit && mission.variantOf != null) {
			//find the mission that this edited mission is said to be a variant of
			let selected = await client.mission.findFirst({
				where: {
					name: mission.variantOf
				},
				select: {
					variant: true,
					id: true
				}
			});
			//clean broken variant group
			if (mission.variant != null) {
				//find other missions with the edited mission's variant ID
				let other = await client.mission.findMany({
					where: {
						variant: mission.variant,
						NOT: {
							id: mission.id
						}
					},
					select: {
						id: true
					}
				});
				//if there is only one other, remove that one's variant ID too since you need at least 2 missions in a variant group
				if (other.length == 1) {
					await auditClient.mission.update({
						where: {
							id: other[0].id
						},
						data: {
							variant: null
						}
					});
				}
			}
			if (!selected) {
				//not found, so remove the edited mission's variant ID
				mission.variant = null;
			} else {
				//found one
				if (!selected.variant) {
					//the found one isn't in a variant group, calculate new variant ID
					let variants = await client.mission.findMany({
						where: {
							NOT: {
								variant: null
							}
						},
						select: {
							variant: true
						}
					});
					let max = Math.max(...variants.map(v => v.variant ?? -1));
					mission.variant = max + 1;
					await auditClient.mission.update({
						where: {
							id: selected.id
						},
						data: {
							variant: mission.variant
						}
					});
				} else mission.variant = selected.variant; //join existing variant group
			}
		}

		await auditClient.mission.update({
			where: {
				id: mission.id
			},
			data: {
				authors: mission.authors,
				bombs: {
					update: mission.bombs.map(bomb => ({
						where: {
							id: bomb.id
						},
						data: {
							modules: bomb.modules,
							time: bomb.time,
							strikes: bomb.strikes,
							widgets: bomb.widgets,
							pools: JSON.parse(JSON.stringify(bomb.pools))
						}
					}))
				},
				completions: {
					update: mission.completions.map(completion => ({
						where: {
							id: completion.id
						},
						data: completion
					}))
				},
				factory: mission.factory,
				timeMode: mission.timeMode,
				strikeMode: mission.strikeMode,
				missionPackId: mission.missionPack.id,
				name: mission.name,
				tpSolve: mission.tpSolve,
				designedForTP: mission.designedForTP,
				logfile: mission.logfile,
				dateAdded: mission.dateAdded,
				notes: mission.notes,
				inGameId: mission.inGameId,
				inGameName: mission.inGameName,
				variant: mission.variant
			}
		});

		throw redirect(303, '/mission/' + properUrlEncode(mission.name));
	}
};

export async function POST({ locals, request }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	const mission: EditMission = await request.json();

	const auditClient = createAuditClient(locals.user)

	await auditClient.mission.update({
		where: {
			id: mission.id
		},
		data: {
			completions: {
				update: mission.completions.map(completion => ({
					where: {
						id: completion.id
					},
					data: completion
				}))
			},
			factory: mission.factory,
			missionPackId: mission.missionPack.id,
			name: mission.name,
			tpSolve: mission.tpSolve
		}
	});

	return new Response(undefined);
}

export async function DELETE({ locals, request }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.VerifyCompletion)) {
		throw forbidden(locals);
	}

	const completion: ID<Completion> = await request.json();

	const auditClient = createAuditClient(locals.user)

	await auditClient.completion.delete({
		where: {
			id: completion.id
		}
	});

	return new Response(undefined);
}
