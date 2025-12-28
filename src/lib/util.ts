import type * as client from '$lib/generated/prisma/client';
import type { Bomb, FrontendUser, ID, Mission, Permission, Pool, Season } from './types';
import { redirect, error } from '@sveltejs/kit';
import type { RepoModule } from './repo';
import { TP_TEAM } from './const';

export function formatTime(seconds: number, milliseconds = false): string {
	let timeParts = [];

	seconds = Math.round(seconds * 100) / 100;

	for (const part of [3600, 60, 1]) {
		timeParts.push(Math.floor(seconds / part).toString());
		seconds -= Math.floor(seconds / part) * part;
	}

	timeParts = timeParts.map((value, index) => (index == 0 ? value : value.padStart(2, '0')));

	return milliseconds
		? `${timeParts.join(':')}.${Math.round(seconds * 100)
				.toString()
				.padStart(2, '0')}`
		: timeParts.join(':');
}

export function parseTime(time: string): number | null {
	const match = time.match(/^(?:(?<hours>\d+:)?(?<minutes>\d{1,2}:))?(?<seconds>\d{1,2}(?:.\d{1,2})?)$/);
	if (match === null) {
		return null;
	}

	const groups = match.groups;
	if (groups === undefined) {
		return null;
	}

	const minutes = parseInt(groups.minutes ?? '0');
	const seconds = parseFloat(groups.seconds);
	if (minutes >= 60 || seconds >= 60) {
		return null;
	}

	return parseInt(groups.hours ?? '0') * 3600 + minutes * 60 + seconds;
}

export function parseInteger(integer: string): number {
	return parseInt(integer);
}

export function pluralize(value: number, singular: string): string {
	return `${value} ${value == 1 ? singular : singular + 's'}`;
}

export function listify(list: string[]): string {
	switch (list.length) {
		case 1:
			return list[0];

		case 2:
			return `${list[0]} and ${list[1]}`;

		default:
			return listify([list.slice(0, -1).join(', ') + ',', list[list.length - 1]]);
	}
}

export function hasPermission(user: FrontendUser | null, permission: Permission): boolean {
	return user !== null && user !== undefined && user.permissions.includes(permission);
}

export function hasAnyPermission(user: FrontendUser | null, ...permissions: Permission[]): boolean {
	return permissions.some(permission => hasPermission(user, permission));
}

export function forbidden(locals: App.Locals) {
	// If the user is not logged in, they might just need to login.
	if (locals.user === null) return redirect(302, '/login');

	return error(403, 'You do not have permission to do that.');
}

export function fixPools<T>(mission: T & { bombs: client.Bomb[] }): T & { bombs: ID<Bomb>[] } {
	return {
		...mission,
		bombs: mission.bombs.map(bomb => {
			return {
				...bomb,
				pools: bomb.pools as unknown as Pool[]
			};
		})
	};
}

export function getSolveTypes(mission: Mission) {
	return {
		normalSolve: mission.completions.some(completion => completion.team.length >= 2),
		efmSolve: mission.completions.some(
			completion => completion.team.length == 1 && !completion.solo && completion.team[0] !== TP_TEAM
		),
		soloSolve: mission.completions.some(completion => completion.solo)
	};
}

export function parseList(value: string) {
	return value
		.split(',')
		.map(name => name.trim())
		.filter(name => name.length !== 0);
}

export function displayStringList(list: string[]): string {
	return list.join(', ');
}

export function isOnlyDigits(str: string): boolean {
	return /^[0-9]+$/.test(str);
}

function findMatchingBrackets(str: string, left: string, right: string): number[] {
	let stack: number[] = [];
	for (let i = 0; i < str.length; i++) {
		let cl = str.substring(i, i + left.length);
		let cr = str.substring(i, i + right.length);

		if (cl == left) stack.push(i);
		else if (cr == right) {
			if (stack.length < 1) return [-1, -1];
			else if (stack.length == 1) return [stack.pop() ?? -1, i];

			stack.pop();
		}
	}

	return [-1, -1];
}

// logical operators supported: &&(and), ||(or), !!(not)
// example: thing one && aaa || bbb && !!ccc
// which means: ("thing one" and "aaa") or ("bbb" and not "ccc")
// brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]
export const reservedSearchStrings = ['[[', ']]', '&&', '||', '!!'];
export function evaluateLogicalStringSearch(expression: string, searchWhat: string[]): boolean {
	let left = reservedSearchStrings[0];
	let right = reservedSearchStrings[1];
	let aand = reservedSearchStrings[2];
	let oor = reservedSearchStrings[3];
	let nnot = reservedSearchStrings[4];
	const expr = expression.trim();
	let exprAfter = expr;

	let br = findMatchingBrackets(expr, left, right);
	while (br[0] >= 0 && br[1] >= 0 && br[1] > br[0]) {
		//valid parentheses found
		const stripped = exprAfter.slice(br[0] + 2, br[1]);
		const val = evaluateLogicalStringSearch(stripped, searchWhat);
		exprAfter = exprAfter.slice(0, br[0]) + (val ? ' ' : '!@#%^&*)(*&#@!') + exprAfter.slice(br[1] + 2);
		br = findMatchingBrackets(exprAfter, left, right);
	}

	const searchParamOr = exprAfter.split(oor).map(x => x.trim());
	let matches = false;
	for (let oo = 0; !matches && oo < searchParamOr.length; oo++) {
		const searchParamAnd = searchParamOr[oo].split(aand).map(x => x.trim());
		matches = true;
		for (let aa = 0; matches && aa < searchParamAnd.length; aa++) {
			const notThis = searchParamAnd[aa].indexOf(nnot) == 0;
			if (notThis) {
				const stripped = searchParamAnd[aa].slice(2).trim();
				if (searchWhat.some(str => str.includes(stripped))) {
					matches = false;
					break;
				}
			} else if (!searchWhat.some(str => str.includes(searchParamAnd[aa]))) {
				matches = false;
				break;
			}
		}
	}
	return matches;
}

export function getWindowWidth(): number {
	return Math.max(
		document.body.scrollWidth,
		document.documentElement.scrollWidth,
		document.body.offsetWidth,
		document.documentElement.offsetWidth,
		document.documentElement.clientWidth
	);
}

export function getWindowHeight(): number {
	return Math.max(
		document.body.scrollHeight,
		document.documentElement.scrollHeight,
		document.body.offsetHeight,
		document.documentElement.offsetHeight,
		document.documentElement.clientHeight
	);
}

export function disappearAll(event: MouseEvent) {
	if (event.target instanceof HTMLElement && event.target.closest('.popup')) return;

	const toHide = document.getElementsByClassName('disappear');

	for (let i = 0; i < toHide.length; i++) {
		let classes = toHide[i].classList;
		if (classes.contains('hidden')) continue;
		let statString = Array.from(classes).find(c => c.startsWith('disappear-stat')) ?? '';
		let stat = parseInt(statString?.substring(14) ?? '1');
		if (stat == 0) {
			for (let i = 0; i < toHide.length; i++) {
				let cl = toHide[i].classList;
				if (!cl.contains('hidden')) {
					cl.add('hidden');
					cl.remove(Array.from(cl).find(c => c.startsWith('disappear-stat')) ?? '');
					cl.add('disappear-stat0');
				}
			}
			return;
		}
		classes.remove(statString);
		classes.add(`disappear-stat${stat - 1}`);
	}
}
export function disappear(elem: HTMLElement) {
	let classes = elem.classList;
	if (classes.contains('hidden')) return;
	let statString = Array.from(classes).find(c => c.startsWith('disappear-stat')) ?? '';
	let stat = parseInt(statString?.substring(14) ?? '1');
	if (stat == 0) {
		classes.add('hidden');
	} else {
		classes.remove(statString);
		classes.add(`disappear-stat${stat - 1}`);
	}
}

function preventDisappear(elem: HTMLElement) {
	let classes = elem.classList;
	let statString = Array.from(classes).find(c => c.startsWith('disappear-stat')) ?? '';

	classes.remove(statString);
	classes.add('disappear-stat1');
}

export function popup(wnd: HTMLElement, obj: HTMLElement, relative = false, skew: number[] = [0, 0]) {
	const wasHidden = wnd.classList.contains('hidden');
	preventDisappear(wnd);
	if (wasHidden) {
		wnd.style.left = '';
		wnd.style.top = '';
		wnd.classList.remove('hidden');
		// Desktop interface: position relative to the object clicked
		const ww = getWindowWidth();
		const wh = getWindowHeight();
		const maxLeft = Math.max(ww - wnd.clientWidth - 10, 0);
		const maxTop = Math.max(wh - wnd.clientHeight - 10, 0);
		const rect = obj.getBoundingClientRect();
		wnd.style.left =
			Math.min((relative ? obj.offsetLeft : rect.left) - wnd.clientWidth * 0.5 + skew[0], maxLeft) + 'px';
		wnd.style.top = Math.min((relative ? rect.height + obj.offsetTop : rect.bottom) + skew[1], maxTop) + 'px';
	}
}

export function titleCase(str: string): string {
	return str
		.split(' ')
		.map(x => x.charAt(0).toUpperCase() + x.slice(1))
		.join(' ');
}

export function getModule(moduleID: string, modules: Record<string, RepoModule> | null): RepoModule {
	const module = modules === null ? null : modules[moduleID];
	if (module != null) {
		return module;
	}

	return {
		BossStatus: null,
		ModuleID: moduleID,
		Name: moduleID,
		FileName: null,
		Origin: moduleID.match(/vanilla/gi) ? 'Vanilla' : 'Mods',
		Published: '2015-01-01',
		Quirks: null,
		RuleSeedSupport: null,
		TranslationOf: null,
		Type: moduleID.match(/needy/gi) ? 'Needy' : 'Regular',
		X: 0,
		Y: 0,
		valid: false
	};
}

export const allSpecialModules = [
	'ALL_NEEDY',
	'ALL_SOLVABLE',
	'ALL_VANILLA_SOLVABLE',
	'ALL_VANILLA_NEEDY',
	'ALL_MODS_SOLVABLE',
	'ALL_MODS_NEEDY'
];
export function isSpecialAllModule(moduleID: string): boolean {
	return allSpecialModules.includes(moduleID);
}

export function getPersonColor(size: number, index: number, solo: boolean, tpSolve: boolean = false): string {
	return size === 1
		? solo
			? '#00ffff'
			: tpSolve
				? '#9146ff'
				: 'hsl(300, 100%, 75%)'
		: index === 0
			? 'hsl(210, 100%, 65%)'
			: 'hsl(0, 100%, 70%)';
}

export function onlyUnique(item: any, pos: number, self: any[]): boolean {
	return self.indexOf(item) == pos;
}

//Must be used only on the browser
export function checkIfImageExists(url: string, callback: (exists: boolean) => void) {
	const img = new Image();
	img.src = url;

	if (img.complete) callback(true);
	else {
		img.onload = () => {
			callback(true);
		};
		img.onerror = () => {
			callback(false);
		};
	}
}

export function withoutArticle(name: string): string {
	return name.replace(/^the /i, '');
}

export function excludeArticleSort(a: string, b: string): number {
	return withoutArticle(a).localeCompare(withoutArticle(b));
}

export function getSteamID(str: string): string {
	let trimmed = str.trim();
	if (isOnlyDigits(trimmed)) return trimmed;

	let url: URL | null = null;
	try {
		url = new URL(trimmed);
	} catch (e: any) {
		return '';
	}

	if (url?.hostname !== 'steamcommunity.com') return '';

	let id = url?.searchParams?.get('id');
	if (id === null) return '';

	if (isOnlyDigits(id)) return id;

	id = id.substring(0, id.search(/[^0-9]/));
	if (isOnlyDigits(id)) return id;

	return '';
}

export function validateSteamID(str: string): string | boolean {
	let id = getSteamID(str);
	if (id === '') {
		return 'Invalid Steam Workshop URL or Workshop ID.';
	}
	return true;
}

export function validateLogfileLink(link: string): string | boolean {
	let url = getLogfileLinks(link);
	if (url[0] === '') {
		return 'Invalid Logfile Analyzer link';
	}
	return true;
}

export function validateMissionID(id: string): string | boolean {
	if (id === null || !id.match(/mod_(.+?)_(.+)/)) {
		return 'This is the mission ID string from Unity. Format expected: mod_missionPackId_missionId';
	}
	if (id.match(/mod_toc_(.+)/i)) {
		return 'That ID is invalid';
	}
	return true;
}

export function getLogfileLinks(link: string): string[] {
	let url: URL | null = null;
	try {
		url = new URL(link);
	} catch (e: any) {
		return [''];
	}

	let host = url.hostname.toLowerCase();
	let path = url.pathname.toLowerCase();
	if (
		host.includes('ktane.timwi.de') &&
		(path.includes('more/logfile') || path.includes('lfa')) &&
		url.hash.includes('file=')
	) {
		let start = url.hash.indexOf('file=') + 5;
		let end = url.hash.slice(start).search(/[^a-zA-Z0-9]/) + start;
		if (end < start) end = url.hash.length;
		let fileId = url.hash.slice(start, end);
		return ['https://ktane.timwi.de/Logfiles/' + fileId + '.txt', 'https://ktane.timwi.de/lfa#file=' + fileId];
	}
	return [''];
}

export function parseDate(dt: string): Date | null {
	const d = new Date(dt);
	return isNaN(d.getTime()) ? null : new Date(+d + (d.getTimezoneOffset() + 300) * 60000);
}

export function formatDate(dt: Date): string {
	if (isNaN(dt?.getTime() ?? NaN)) return '';
	const d = new Date(dt.getTime() - (dt.getTimezoneOffset() - 300) * 60000);
	return d.toISOString().split('T')[0];
}

export function parseUTCDate(dt: string): Date | null {
	return new Date(dt);
}

export function formatUTCDate(dt: Date): string {
	if (isNaN(dt?.getTime() ?? NaN)) return '';
	return dt.toISOString().split('Z')[0];
}

type DateSortable = { id: number; dateAdded: Date | null };
export function dateAddedSort(a: DateSortable, b: DateSortable): number {
	return a.dateAdded == null || b.dateAdded == null ? a.id - b.id : a.dateAdded.getTime() - b.dateAdded.getTime();
}

export const logicalSearchTooltip =
	'Logical operators supported: &&(and), ||(or), !!(not)\n' +
	'Example: thing one && aaa || bbb && !!ccc\n' +
	'Which means: ("thing one" AND "aaa") OR ("bbb" AND NOT "ccc")\n' +
	'Brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]';

export function properUrlEncode(url: string): string {
	return encodeURIComponent(url).replace(/'/g, '%27');
}

export function classifyLink(link: string): string {
	let url: URL | null = null;
	try {
		url = new URL(link);
	} catch (e: any) {
		return 'Link';
	}

	let host = url.hostname.toLowerCase();
	let path = url.pathname.toLowerCase();
	if (
		host.includes('youtube.com') ||
		host.includes('youtu.be') ||
		host.includes('vimeo.com') ||
		host.includes('twitch.tv') ||
		host.includes('bilibili.com')
	) {
		return 'Vid';
	} else if (host.includes('ktane.timwi.de') && (path.includes('more/logfile') || path.includes('lfa'))) {
		return 'Log';
	}
	return 'Link';
}

export function currSeason(season: Pick<Season, 'name'> | null, currentSeasonName: string): boolean {
	return season?.name === currentSeasonName;
}
export function pastSeason(season: Pick<Season, 'name'> | null, currentSeasonName: string): boolean {
	return season != null && season.name !== currentSeasonName;
}
