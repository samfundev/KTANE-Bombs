import asUser from '$lib/auditlog';
import { Permission } from '$lib/types';
import type { QueueItem } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { TP_TEAM } from '$lib/const';

export const POST: RequestHandler = async function ({ locals, request }: RequestEvent) {
	const { accept, item, replaceId }: { accept: boolean; item: QueueItem; replaceId: number } = await request.json();

	const client = asUser(locals.user)
	switch (item.type) {
		case 'mission':
			if (!hasPermission(locals.user, Permission.VerifyMission)) {
				throw forbidden(locals);
			}

			if (accept) {
				if (item.mission.name.startsWith('[[UPDATE]] ')) {
					let name = item.mission.name.substring(11);
					//find mission to be updated
					let selected = await client.mission.findFirst({
						where: {
							name: {
								equals: name,
								mode: 'insensitive'
							}
						},
						select: {
							id: true
						}
					});
					try {
						//delete bomb records from mission being updated
						await client.bomb.deleteMany({ where: { missionId: selected?.id } });
						//update mission with parameters copied from queue item
						await client.mission.update({
							where: {
								id: selected?.id
							},
							data: {
								authors: item.mission.authors,
								bombs: {
									//create new bomb records matching the queue item's bombs
									create: item.mission.bombs.map(bomb => ({
										modules: bomb.modules,
										time: bomb.time,
										strikes: bomb.strikes,
										widgets: bomb.widgets,
										pools: JSON.parse(JSON.stringify(bomb.pools))
									}))
								},
								factory: item.mission.factory,
								timeMode: item.mission.timeMode,
								strikeMode: item.mission.strikeMode,
								missionPackId: item.mission.missionPack?.id,
								name: name,
								logfile: item.mission.logfile,
								designedForTP: item.mission.designedForTP
							}
						});
						//delete queue item in database entirely
						await client.bomb.deleteMany({ where: { missionId: item.mission.id } });
						await client.mission.delete({ where: { id: item.mission.id } });
					} catch (e) {
						throw e;
					}
				} else {
					//accepted - make queue item visible (verified)
					await client.mission.update({
						where: {
							id: item.mission.id
						},
						data: {
							verified: true
						}
					});
				}
			} else {
				//rejected - delete queue item entirely
				await client.bomb.deleteMany({ where: { missionId: item.mission.id } });
				await client.mission.delete({ where: { id: item.mission.id } });
			}

			break;
		case 'completion':
			if (!hasPermission(locals.user, Permission.VerifyCompletion)) {
				throw forbidden(locals);
			}

			if (accept) {
				const tp = item.completion.team[0] === TP_TEAM;
				const first =
					!tp &&
					(await client.completion.findFirst({
						where: {
							missionId: item.mission.id,
							verified: true,
							first: true
						}
					})) === null;

				if (tp)
					await client.mission.update({
						where: { id: item.mission.id },
						data: { tpSolve: true }
					});

				if (replaceId >= 0) {
					await client.completion.update({
						where: {
							id: replaceId
						},
						data: {
							team: item.completion.team,
							time: item.completion.time,
							solo: item.completion.solo,
							proofs: item.completion.proofs
						}
					});
					await client.completion.delete({ where: { id: item.completion.id } });
				} else {
					await client.completion.update({
						where: {
							id: item.completion.id
						},
						data: {
							verified: true,
							first
						}
					});
				}
			} else {
				await client.completion.delete({ where: { id: item.completion.id } });
			}

			break;
		case 'missionpack':
			if (!hasPermission(locals.user, Permission.VerifyMissionPack)) {
				throw forbidden(locals);
			}
			if (accept) {
				await client.missionPack.update({
					where: {
						id: item.pack.id
					},
					data: {
						verified: true
					}
				});
			} else {
				await client.missionPack.delete({ where: { id: item.pack.id } });
			}

			break;
	}

	return new Response(undefined);
};
