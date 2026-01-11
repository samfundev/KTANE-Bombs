import client from '$lib/client';
import OAuth from '$lib/oauth';
import { Prisma } from '$lib/generated/prisma/client';
import type { Cookies } from '@sveltejs/kit';
import type { RESTPostOAuth2AccessTokenResult } from '@discordjs/core';
import { redirect, error } from '@sveltejs/kit';

export const load = async function load({ url, cookies }: any) {
	const code = url.searchParams.get('code');
	if (code === null) error(406);

	const result = await OAuth.tokenRequest(code);

	return await login(result, cookies);
};

export const actions = {
	selectUsername: async ({ request, cookies }: any) => {
		const fData = await request.formData();
		const username = JSON.parse(fData.get('username'));
		const result = JSON.parse(fData.get('result'));
		return await login(<RESTPostOAuth2AccessTokenResult>result, cookies, username);
	}
};

async function login(result: RESTPostOAuth2AccessTokenResult, cookies: Cookies, username: string | null = null) {
	try {
		const user = await OAuth.getUser(result.access_token);

		const discordName = user.global_name != null ? user.username : `${user.username}#${user.discriminator}`;
		const sheetUsername = user.global_name != null ? user.global_name : user.username;
		//first login or username missing
		if (username == null) {
			const findUser = await client.user.findUnique({ where: { id: user.id } });
			//first login
			if (!findUser) {
				const users = await client.user.findMany({ select: { username: true } });
				return {
					username: sheetUsername,
					firstTime: true,
					takenUsernames: users.map(usr => usr.username),
					result: result
				};
			}
			username = findUser.username;
		}
		//update or create user in database
		await client.user.upsert({
			where: {
				id: user.id
			},
			create: {
				id: user.id,
				username: username ?? sheetUsername,
				discordName: discordName,
				accessToken: result.access_token,
				refreshToken: result.refresh_token,
				avatar: user.avatar ?? `${parseInt(user.discriminator) % 5}`
			},
			update: {
				username: username ?? sheetUsername,
				discordName: discordName,
				accessToken: result.access_token,
				refreshToken: result.refresh_token,
				avatar: user.avatar ?? `${parseInt(user.discriminator) % 5}`
			}
		});
	} catch (e) {
		if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) {
			throw e;
		}
		// Conflict happened on username, the user needs to pick another.
		const users = await client.user.findMany({ select: { username: true } });
		return {
			username: username,
			firstTime: false,
			takenUsernames: users.map(usr => usr.username),
			result: result
		};
	}
	cookies.set('token', result.access_token, {
		secure: true,
		httpOnly: true,
		maxAge: 2629800,
		path: '/'
	});
	redirect(302, '/');
}
