import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import { getData, type RepoModule } from '$lib/repo';
import { type Completion, Permission, type ID } from '$lib/types.svelte';
import { excludeArticleSort, forbidden, hasPermission, properUrlEncode } from '$lib/util';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { EditMission } from './_types';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sortBombs } from '../../_shared';

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
		error(404, 'Mission not found.');
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

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const mission = JSON.parse(fData.get('mission')?.toString() ?? '');

		await auditClient.mission.delete({
			where: {
				name: mission.name
			}
		});

		redirect(303, '/');
	},
	deleteCompletion: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyCompletion)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const completion: ID<Completion> = JSON.parse(fData.get('completion')?.toString() ?? '');

		await auditClient.completion.delete({
			where: {
				id: completion.id
			}
		});

		return {};
	},
	editCompletion: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyCompletion)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const completion: ID<Completion> = JSON.parse(fData.get('completion')?.toString() ?? '');

		await auditClient.completion.update({
			where: {
				id: completion.id
			},
			data: {
				proofs: completion.proofs,
				time: completion.time,
				solo: completion.solo,
				first: completion.first,
				old: completion.old,
				team: completion.team,
				notes: completion.notes,
				dateAdded: completion.dateAdded
			}
		});

		return {};
	},
	editMission: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMission)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const mission: EditMission = JSON.parse(fData.get('mission')?.toString() ?? '');
		const variantEdit: boolean = JSON.parse(fData.get('variantEdit')?.toString() ?? '');
		const modules: Record<string, RepoModule> | null = await getData();

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

		const beforeMission = await client.mission.findUnique({
			where: { id: mission.id },
			include: {
				bombs: {
					orderBy: { id: 'asc' }
				},
				completions: {
					where: { verified: true },
					select: client.$exclude('completion', ['missionId'])
				},
				missionPack: true
			}
		});
		if (beforeMission) {
			//bombs
			sortBombs(mission, modules);
			sortBombs(beforeMission, modules);
			if (JSON.stringify(beforeMission.bombs) != JSON.stringify(mission.bombs)) {
				await auditClient.mission.update({
					where: {
						id: mission.id
					},
					data: {
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
						}
					}
				});
			}

			//missionpack
			if (beforeMission.missionPack?.name !== mission.missionPack.name) {
				await auditClient.mission.update({
					where: {
						id: mission.id
					},
					data: {
						missionPackId: mission.missionPack.id
					}
				});
			}

			//everything else
			await auditClient.mission.update({
				where: {
					id: mission.id
				},
				data: {
					authors: mission.authors,
					factory: mission.factory,
					timeMode: mission.timeMode,
					strikeMode: mission.strikeMode,
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
		}

		redirect(303, '/mission/' + properUrlEncode(mission.name));
	}
};
