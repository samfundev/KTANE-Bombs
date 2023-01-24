import client from '$lib/client';
import { Permission } from '$lib/types';
import { forbidden, hasPermission } from '$lib/util';
import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async function ({ locals, request }) {
	if (!hasPermission(locals.user, Permission.RenameUser)) forbidden(locals);

	const { oldUsername, username, nameExistsOK } = await request.json();

	const completions = await client.completion.findMany({
		where: {
			team: {
				has: oldUsername
			}
		}
	});

	const missions = await client.mission.findMany({
		where: {
			authors: {
				has: oldUsername
			}
		}
	});
	if (!nameExistsOK) {
		const completionsMerge = await client.completion.findFirst({
			where: {
				team: {
					has: username
				}
			}
		});

		const missionsMerge = await client.mission.findFirst({
			where: {
				authors: {
					has: username
				}
			}
		});

		if (missionsMerge !== null || completionsMerge !== null) return new Response(undefined, { status: 202 });
	}

	const queries = [
		// Mission
		...missions.map(mission =>
			client.mission.update({
				where: {
					id: mission.id
				},
				data: {
					authors: mission.authors.map(name => (name === oldUsername ? username : name))
				}
			})
		),
		// Completions
		...completions.map(completion =>
			client.completion.update({
				where: {
					id: completion.id
				},
				data: {
					team: completion.team.map(name => (name === oldUsername ? username : name))
				}
			})
		)
	];

	await client.$transaction(queries);

	const user = await client.user.findFirst({
		where: {
			username: oldUsername
		}
	});

	if (user !== null && user !== undefined) {
		// User
		await client.user.update({
			where: {
				username: oldUsername
			},
			data: {
				username
			}
		});
	}

	throw redirect(301, `/user/${encodeURIComponent(username)}`);
};
