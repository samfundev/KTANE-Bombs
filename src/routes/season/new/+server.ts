import { json, type RequestHandler } from '@sveltejs/kit';
import client from '$lib/client';

interface RequestBody {
		seasonName: string;
}

export const POST: RequestHandler = async ({ request }) => {
		try {
				const { seasonName } = await request.json() as RequestBody;

				if (!seasonName?.trim()) {
						return json({ error: 'Season name is required' }, { status: 400 });
				}

				const newSeason = await client.seasons.create({
						data: { seasonName: seasonName.trim() }
				});

				return json({ success: true, data: newSeason }, { status: 201 });
		} catch (error) {
				console.error('Error creation season:', error);
				return json({ error: 'Failed to create season' }, { status: 500 });
		}
};