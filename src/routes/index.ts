import client from '$lib/client';
import type { RequestHandlerOutput } from '@sveltejs/kit';

export async function get(): Promise<RequestHandlerOutput> {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			bombs: true,
			tpSolve: true,
			factory: true,
			completions: true
		}
	});

	return {
		body: {
			missions
		}
	};
}
