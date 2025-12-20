import { json, type RequestHandler } from '@sveltejs/kit';
import client from '$lib/client';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(<string>params.id);

		await client.seasons.delete({
			where: { id }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting season:', error);
		return json({ error: 'Failed to delete season' }, { status: 500 });
	}
};