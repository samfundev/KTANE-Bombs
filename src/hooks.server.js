import client from '$lib/client';
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('token');
	const conflict = event.cookies.get('usernameConflict');

	event.locals.token = token ?? null;
	if (!conflict) {
		// @ts-ignore
		event.locals.user = token
			? await client.user.findFirst({
					where: {
						accessToken: token
					},
					select: {
						id: true,
						username: true,
						avatar: true,
						permissions: true
					}
			  })
			: null;
	}
	const response = await resolve(event);
	response.headers.set("Access-Control-Allow-Origin", "*");
	return response;
}
