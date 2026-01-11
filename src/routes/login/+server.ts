import OAuth from '$lib/oauth';
import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = function GET() {
	const url = OAuth.generateAuthUrl();

	redirect(302, url);
};
