import client from '$lib/client';
import type { Completion } from '$lib/types';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const { completion, missionName }: { completion: Completion; missionName: string } = await request.json();

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

	let equalSolve = mission.completions.findIndex(
		c =>
			JSON.stringify(c.team.slice(0, 1).concat(c.team.slice(1).sort())) ==
			JSON.stringify(completion.team.slice(0, 1).concat(completion.team.slice(1).sort()))
	);

	await client.completion.create({
		data: {
			...completion,
			mission: {
				connect: {
					id: mission.id
				}
			},
			first: false, // This will be set to the correct value once the completion is verified.
			verified: false
		}
	});
	if (equalSolve >= 0) return new Response(undefined, { status: 202 });
	else return new Response(undefined);
}
