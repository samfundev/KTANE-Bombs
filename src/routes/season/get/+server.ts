import { json, type RequestHandler } from '@sveltejs/kit';
import client from '$lib/client';

export const GET: RequestHandler = async () => {
	try {
		const seasons = await client.seasons.findMany({
			orderBy: { id: 'asc' }
		});

		return json(seasons);
	} catch (error) {
		console.error('Error fetching seasons:', error);
		return json([], { status: 500 });
	}
};