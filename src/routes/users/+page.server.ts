import client from '$lib/client';
import type { RequestHandler } from '@sveltejs/kit';
import { Permission } from '$lib/types.svelte';
import { hasPermission } from '$lib/util';

export const load = async function ({ parent }: any) {
	const { user } = await parent();
	const users = await client.user.findMany({
		select: {
			id: true,
			avatar: true,
			username: true,
			discordName: hasPermission(user, Permission.RenameUser),
			permissions: true
		}
	});

	return {
		users: users
	};
};
