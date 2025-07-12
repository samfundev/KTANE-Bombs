import createAuditClient from '$lib/auditlog';
import { type Completion, Permission, type ID } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestEvent } from '@sveltejs/kit';
import type { EditMission } from './_types';

export async function POST({ locals, request }: RequestEvent) {
	if (!hasPermission(locals.user, Permission.VerifyMission)) {
		throw forbidden(locals);
	}

	const mission: EditMission = await request.json();

	const auditClient = createAuditClient(locals.user);

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

	const auditClient = createAuditClient(locals.user);

	await auditClient.completion.delete({
		where: {
			id: completion.id
		}
	});

	return new Response(undefined);
}
