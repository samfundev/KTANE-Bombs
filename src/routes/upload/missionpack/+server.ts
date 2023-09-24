import client from '$lib/client';
import type { MissionPack } from '$lib/types';
import { forbidden } from '$lib/util';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ locals, request }: RequestEvent) {
	if (locals.user == null) {
		throw forbidden(locals);
	}
	const pack: MissionPack = await request.json();
	pack.uploadedBy = locals.user.id;
	let equalPack = await client.missionPack.findUnique({
		where: {
			name: pack.name
		},
		select: {
			name: true,
			verified: true
		}
	});
	if (equalPack !== null) {
		if (equalPack.verified === false)
			return new Response('Mission pack is already in the queue for verfication.', { status: 409 });
		else return new Response('Duplicate mission pack not uploaded.', { status: 406 });
	}
	await client.missionPack.create({
		data: {
			...pack,
			verified: false
		}
	});

	return new Response('Mission pack uploaded successfully!');
}
