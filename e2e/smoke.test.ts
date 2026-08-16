import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';

// Error collection

interface CollectedErrors {
	pageErrors: Error[];
	consoleErrors: string[];
}

function attachErrorCollectors(page: Page): CollectedErrors {
	const collected: CollectedErrors = { pageErrors: [], consoleErrors: [] };
	page.on('pageerror', err => collected.pageErrors.push(err));
	page.on('console', msg => {
		if (msg.type() === 'error') collected.consoleErrors.push(msg.text());
	});
	return collected;
}

/**
 * Filter browser-level noise unrelated to app code:
 *   - Missing favicon
 *   - Aborted / unresolved network requests for optional external resources
 */
function isAppError(msg: string): boolean {
	if (msg.includes('favicon')) return false;
	if (msg.includes('net::ERR_ABORTED')) return false;
	if (msg.includes('net::ERR_NAME_NOT_RESOLVED')) return false;
	if (msg.includes('net::ERR_CONNECTION_REFUSED')) return false;
	return true;
}

/**
 * Navigate to `url`, then assert:
 *   - HTTP status < 500  (4xx redirects are fine for auth-gated pages)
 *   - No uncaught JS exceptions
 *   - No app-level console errors
 */
async function checkPage(page: Page, url: string): Promise<void> {
	const collected = attachErrorCollectors(page);
	const response = await page.goto(url, { waitUntil: 'networkidle' });

	const status = response?.status() ?? 200;
	expect(status, `${url} returned a server error`).toBeLessThan(500);

	expect(
		collected.pageErrors.map(e => e.message),
		`Uncaught JS errors on ${url}`
	).toEqual([]);

	expect(collected.consoleErrors.filter(isAppError), `Console errors on ${url}`).toEqual([]);
}

// Static pages

const STATIC_ROUTES = [
	'/',
	'/auditlog',
	'/changelog',

	'/modules',
	'/restrictedmanuals',
	'/rules',
	'/season',
	'/seasoninfo',
	'/solvers',
	'/upload',
	'/users',
	'/users/rename',
	'/verify'
] as const;

for (const route of STATIC_ROUTES) {
	test(route, async ({ page }) => {
		await checkPage(page, route);
	});
}

// Dynamic pages - detail views

const samplePaths = JSON.parse(fs.readFileSync('e2e/.auth/sample-paths.json', 'utf8'));

for (const name of ['mission', 'missionpack', 'season', 'user'] as const) {
	const path = samplePaths[name];
	test(name, async ({ page }) => {
		test.skip(path === null, `No ${name}s found`);
		await checkPage(page, path);
	});
	if (name === 'user') continue;
	test(`${name} edit`, async ({ page }) => {
		test.skip(path === null, `No ${name}s found`);
		await checkPage(page, `${path}/edit`);
	});
}
