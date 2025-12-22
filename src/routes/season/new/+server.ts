import { json, type RequestHandler } from '@sveltejs/kit';
import client from '$lib/client';
import { forbidden, hasPermission } from '$lib/util';
import { Permission } from '$lib/types';
import createAuditClient from '$lib/auditlog';

interface RequestBody {
	seasonName: string;
	start: Date;
	end: Date;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!hasPermission(locals.user, Permission.ManageSeasons)) {
		throw forbidden(locals);
	}
	try {
		const { seasonName, start, end  } = await request.json() as RequestBody;

		if (!seasonName?.trim()) {
			return json({ error: 'Season name is required' }, { status: 400 });
		}

		const auditClient = createAuditClient(locals.user);

		const newSeason = await auditClient.season.create({
			data: {
				name: seasonName.trim(),
				start,
				end
			}
		});

		return json({ success: true, data: newSeason }, { status: 201 });
	} catch (error) {
		console.error('Error creation season:', error);
		return json({ error: 'Failed to create season' }, { status: 500 });
	}
};