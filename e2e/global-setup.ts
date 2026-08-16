import { config } from 'dotenv';
import findConfig from 'find-config';
import { PrismaClient } from '../src/lib/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

config({ path: findConfig('.env') ?? '.env' });

/** A fixed token that only ever exists in the local dev/test database. */
export const E2E_TOKEN = 'e2e-test-token-do-not-use-in-production';

const E2E_USER = {
	id: '000000000000000001',
	username: 'E2E Test Admin',
	discordName: 'e2etest',
	avatar: '0',
	accessToken: E2E_TOKEN,
	refreshToken: 'e2e-test-refresh-token',
	// All Permission enum values: 0–6
	permissions: [0, 1, 2, 3, 4, 5, 6]
};

export default async function globalSetup() {
	// 1. Upsert the test user in the database
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL
	});
	const prisma = new PrismaClient({ adapter });

	try {
		await prisma.user.upsert({
			where: { id: E2E_USER.id },
			create: E2E_USER,
			update: {
				permissions: E2E_USER.permissions,
				accessToken: E2E_USER.accessToken
			}
		});
	} finally {
		await prisma.$disconnect();
	}

	// 2. Write the browser storage state file directly
	// This avoids launching a browser (which may not be available in all envs).
	// The format is the same JSON that Playwright's storageState() produces.
	const storageState = {
		cookies: [
			{
				name: 'token',
				value: E2E_TOKEN,
				domain: 'localhost',
				path: '/',
				expires: -1,
				httpOnly: false,
				secure: false,
				sameSite: 'Lax'
			}
		],
		origins: []
	};

	const authDir = path.join('e2e', '.auth');
	fs.mkdirSync(authDir, { recursive: true });
	fs.writeFileSync(path.join(authDir, 'admin.json'), JSON.stringify(storageState, null, 2));

	// 3. Write sample paths for dynamic routes
	const [mission, season, user, pack] = await Promise.all([
		prisma.mission.findFirst({ select: { name: true } }),
		prisma.season.findFirst({ select: { name: true } }),
		prisma.user.findFirst({ select: { username: true } }),
		prisma.missionPack.findFirst({ select: { name: true } })
	]);

	fs.writeFileSync(
		path.join(authDir, 'sample-paths.json'),
		JSON.stringify({
			mission: mission ? `/mission/${encodeURIComponent(mission.name)}` : null,
			missionpack: pack ? `/missionpack/${encodeURIComponent(pack.name)}` : null,
			season: season ? `/season/${encodeURIComponent(season.name)}` : null,
			user: user ? `/user/${encodeURIComponent(user.username)}` : null
		})
	);
}
