import { API } from '@discordjs/core/http-only';
import { REST } from '@discordjs/rest';

const rest = new REST({ version: '10' });
const api = new API(rest);
const oauth = api.oauth2;

const scope = ['identify'];

export default {
	generateAuthUrl() {
		return oauth.generateAuthorizationURL({
			client_id: process.env.VITE_DISCORD_CLIENT_ID!,
			redirect_uri: process.env.VITE_DISCORD_REDIRECT_URI!,
			scope: scope.join(' '),
			response_type: 'code',
			prompt: 'consent'
		});
	},
	tokenRequest(code: string) {
		return oauth.tokenExchange({
			code,
			client_id: process.env.VITE_DISCORD_CLIENT_ID!,
			client_secret: process.env.VITE_DISCORD_CLIENT_SECRET!,
			redirect_uri: process.env.VITE_DISCORD_REDIRECT_URI!,
			grant_type: 'authorization_code'
		});
	},
	async getUser(accessToken: string) {
		const rest = new REST({ version: '10', authPrefix: 'Bearer' }).setToken(accessToken);
		const api = new API(rest);
		return await api.users.getCurrent();
	}
};
