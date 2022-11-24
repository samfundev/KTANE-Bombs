import client from '$lib/client';
import { getData } from '$lib/repo';
import { Completion, Permission, type ID } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
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
			bombs: true,
			completions: {
				where: {
					verified: true
				},
				select: client.$exclude('completion', ['missionId'])
			},
			designedForTP: true,
			tpSolve: true,
			factory: true,
			variant: true,
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
			name: true
		}
	});

	const missions = await client.mission.findMany({
		where: {
			NOT: {
				name: mission
			}
		},
		select: {
			name: true
		}
	});

	const firstVariant = await client.mission.findFirst({
		where: {
			variant: missionResult.variant ?? -1,
			NOT: {
				id: missionResult.id
			}
		},
		select: {
			name: true
		}
	});

	if (!missionResult.verified && !hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	return {
		mission: {
			...missionResult,
			variantOf: firstVariant?.name ?? ''
		},
		missionNames: missions.map(m => m.name).sort(),
		packs,
		modules: await getData()
	};
};

export const actions: Actions = {
	deleteMission: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.VerifyMission)) {
			throw forbidden(locals);
		}
		const fData = await request.formData();
		const mission = JSON.parse(fData.get('mission')?.toString() ?? '');

		await client.mission.delete({
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
		const fData = await request.formData();
		const completion: ID<Completion> = JSON.parse(fData.get('completion')?.toString() ?? '');

		await client.completion.delete({
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

		const fData = await request.formData();
		const mission: EditMission = JSON.parse(fData.get('mission')?.toString() ?? '');
		if (mission.variantOf != null) {
			let selected = await client.mission.findFirst({
				where: {
					name: mission.variantOf
				},
				select: {
					variant: true,
					id: true
				}
			});
			if (!selected) {
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
				if (other.length == 1) {
					await client.mission.update({
						where: {
							id: other[0].id
						},
						data: {
							variant: null
						}
					});
				}
				mission.variant = null;
			} else if (!selected.variant) {
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
				await client.mission.update({
					where: {
						id: selected.id
					},
					data: {
						variant: mission.variant
					}
				});
			} else mission.variant = selected.variant;
		}

		await client.mission.update({
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
							pools: bomb.pools.map(pool => ({
								modules: pool.modules,
								count: pool.count
							}))
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
				missionPackId: mission.missionPack.id,
				name: mission.name,
				tpSolve: mission.tpSolve,
				designedForTP: mission.designedForTP,
				variant: mission.variant
			}
		});

		throw redirect(303, '/mission/' + mission.name);
	}
};

export async function POST({ locals, request }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	const mission: EditMission = await request.json();

	await client.mission.update({
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

	await client.completion.delete({
		where: {
			id: completion.id
		}
	});

	return new Response(undefined);
}
