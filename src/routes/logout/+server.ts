import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = function GET({ cookies }) {
	cookies.set('token', '', {
		secure: true,
		httpOnly: true,
		maxAge: 0,
		path: '/'
	});
	redirect(302, '/');
};
