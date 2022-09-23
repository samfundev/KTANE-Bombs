import client from '$lib/client';
import { getData } from '$lib/repo';
import { FilterableGroup, Filterable } from '$lib/types';
import type { RequestHandlerOutput } from '@sveltejs/kit';

export async function get(): Promise<RequestHandlerOutput> {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			authors: true,
			bombs: true,
			tpSolve: true,
			factory: true,
			completions: true
		}
	});

	return {
		body: {
			missions,
			modules: await getData()
		}
	};
}
