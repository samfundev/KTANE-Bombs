import { defineConfig, devices } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const executablePath = await promisify(exec)('which chromium').then(({ stdout }) => stdout.trim());

export default defineConfig({
	globalSetup: './e2e/global-setup.ts',
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'list',

	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		storageState: 'e2e/.auth/admin.json'
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: { executablePath }
			}
		}
	],

	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:3000',
		reuseExistingServer: true,
		timeout: 30_000
	}
});
