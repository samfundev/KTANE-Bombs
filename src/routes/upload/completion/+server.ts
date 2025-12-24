import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import type { Completion } from '$lib/types';
import { forbidden } from '$lib/util';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ locals, request }: RequestEvent) {
	if (locals.user == null) {
		throw forbidden(locals);
	}

	const auditClient = createAuditClient(locals.user);

	const {
		completion,
		missionName,
		seasonId
	}: { completion: Completion; missionName: string; seasonId: number | undefined } = await request.json();
	completion.uploadedBy = locals.user.id;
	if (completion.team.length != 1 && completion.solo) {
		return new Response(undefined, { status: 406 });
	}
	const mission = await client.mission.findFirst({
		where: { name: missionName },
		select: {
			id: true,
			completions: {
				where: {
					team: {
						hasSome: completion.team
					}
				}
			}
		}
	});

	if (mission === null) {
		return new Response(undefined, { status: 406 });
	}

	let equalSolves = mission.completions.filter(
		c =>
			c.solo == completion.solo &&
			JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
				JSON.stringify(completion.team.slice(0, 1).concat(completion.team.slice(1).sort()))
	);
	if (equalSolves.some(s => s.verified == false))
		//don't allow duplicate solve uploads that are already in the verify queue
		return new Response(undefined, { status: 409 });

	await auditClient.completion.create({
		data: {
			...completion,
			mission: {
				connect: {
					id: mission.id
				}
			},
			season: seasonId == undefined ? undefined : {
				connect: {
					id: seasonId
				}
			},
			first: false, // This will be set to the correct value once the completion is verified.
			verified: false
		}
	});

	if (equalSolves.length > 0) return new Response(undefined, { status: 202 }); //replacing an existing solve
	else return new Response(undefined);
}
