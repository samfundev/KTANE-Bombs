import client from '$lib/client';
import { error, type RequestEvent, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ params: { mission } }: RequestEvent) {
	const missionData = await client.mission.findUnique({
		where: { name: mission },
		select: { logfileContent: true }
	});

	if (!missionData) error(404, 'Mission not found');
	const { logfileContent } = missionData;
	if (!logfileContent) error(404, 'Logfile not found');

	return new Response(logfileContent);
};
