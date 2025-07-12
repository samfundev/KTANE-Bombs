import client from '$lib/client';
import createAuditClient from '$lib/auditlog';
import { Permission } from '$lib/types.svelte';
import { forbidden, hasPermission, properUrlEncode } from '$lib/util';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async function ({ parent, locals }: any) {
	const { user } = await parent();
	if (!hasPermission(user, Permission.RenameUser)) {
		throw forbidden(locals);
	}
	const users = await client.user.findMany({
		select: {
			id: true,
			avatar: true,
			username: true,
			discordName: true,
			permissions: true
		}
	});

	return {
		users: users
	};
};

export const actions: Actions = {
	renameOnly: async ({ locals, request }: RequestEvent) => {
		if (!hasPermission(locals.user, Permission.RenameUser)) {
			throw forbidden(locals);
		}

		const auditClient = createAuditClient(locals.user);

		const fData = await request.formData();
		const oldUsername: string = JSON.parse(fData.get('oldUsername')?.toString() ?? '');
		const newUsername: string = JSON.parse(fData.get('newUsername')?.toString() ?? '');

		const user = await client.user.findFirst({
			where: {
				username: oldUsername
			}
		});

		if (user !== null && user !== undefined) {
			// User
			await auditClient.user.update({
				where: {
					username: oldUsername
				},
				data: {
					username: newUsername
				}
			});
		}

		redirect(303, '/user/' + properUrlEncode(newUsername));
	}
};
