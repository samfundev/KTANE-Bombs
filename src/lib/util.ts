import type * as client from '@prisma/client';
import type { Bomb, FrontendUser, Mission, Permission, Pool } from './types';
import { redirect, error } from '@sveltejs/kit';
import type { RepoModule } from './repo';

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

	return error(403, 'You do not have permission for to do that.');
}

export function fixPools<T>(mission: T & { bombs: client.Bomb[] }): T & { bombs: Bomb[] } {
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
		efmSolve: mission.completions.some(completion => completion.team.length == 1),
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
	const lPar = str.indexOf(left);
	let lPar2 = str.indexOf(left, lPar + 2);
	let rPar = str.indexOf(right, lPar + 2);
	while (lPar >= 0 && lPar2 >= 0 && rPar >= 0 && lPar2 < rPar) {
		lPar2 = str.indexOf(left, rPar + 2);
		rPar = str.indexOf(right, rPar + 2);
	}

	return [lPar, rPar];
}

// logical operators supported: &&(and), ||(or), !!(not)
// example: thing one && aaa || bbb && !!ccc
// which means: ("thing one" and "aaa") or ("bbb" and not "ccc")
// brackets are supported too: [[ thing one || aaa ]] && [[ bbb || !!ccc ]]
export function evaluateLogicalStringSearch(expression: string, searchWhat: string): boolean {
	const left = '[[';
	const right = ']]';
	const aand = '&&';
	const oor = '||';
	const nnot = '!!';
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
				if (searchWhat.includes(stripped)) {
					matches = false;
					break;
				}
			} else if (!searchWhat.includes(searchParamAnd[aa])) {
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

export function disappear(preventDisappear = 0): number {
	if (preventDisappear === 0) {
		const toHide = document.getElementsByClassName('disappear');
		for (let i = 0; i < toHide.length; i++) toHide[i].classList.add('hidden');
	} else return preventDisappear - 1;
	return preventDisappear;
}

export function popup(
	event: any,
	wnd: HTMLElement,
	obj: HTMLElement,
	pd: number,
	relative = false,
	skew: number[] = [0, 0]
): number {
	const wasHidden = wnd.classList.contains('hidden');
	const pd2 = disappear(pd);
	if (wasHidden) {
		wnd.style.left = '';
		wnd.style.top = '';
		wnd.classList.remove('hidden');
		// Desktop interface: position relative to the object clicked
		const maxLeft = Math.max(getWindowWidth() - wnd.clientWidth - 30, 0);
		const maxTop = Math.max(getWindowHeight() - wnd.clientHeight - 30, 0);
		const rect = obj.getBoundingClientRect();
		wnd.style.left =
			Math.min((relative ? obj.offsetLeft : rect.left) - wnd.clientWidth * 0.5 + skew[0], maxLeft) + 'px';
		wnd.style.top = Math.min((relative ? rect.height + obj.offsetTop : rect.bottom) + skew[1], maxTop) + 'px';
	}

	return pd2;
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
		RuleSeedSupport: null,
		Type: moduleID.match(/needy/gi) ? 'Needy' : 'Regular',
		Quirks: null,
		X: 0,
		Y: 0
	};
}

export function hasSpecialIcon(moduleID: string): boolean {
	return [
		'ALL_NEEDY',
		'ALL_SOLVABLE',
		'ALL_VANILLA_SOLVABLE',
		'ALL_VANILLA_NEEDY',
		'ALL_MODS_SOLVABLE',
		'ALL_MODS_NEEDY'
	].includes(moduleID);
}

export function getPersonColor(size: number, index: number, solo: boolean): string {
	return size === 1
		? solo
			? '#00ffff'
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
