import type * as client from '@prisma/client';
import type { Bomb, FrontendUser, Mission, Permission, Pool } from './types';

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
	const match = time.match(
		/^(?:(?<hours>\d+:)?(?<minutes>\d{1,2}:))?(?<seconds>\d{1,2}(?:.\d{1,2})?)$/
	);
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
	return user !== null && user.permissions.includes(permission);
}

export function hasAnyPermission(user: FrontendUser | null, ...permissions: Permission[]): boolean {
	return permissions.some((permission) => hasPermission(user, permission));
}

export function forbidden(locals: App.Locals) {
	// If the user is not logged in, they might just need to login.
	if (locals.user === null)
		return {
			status: 302,
			redirect: '/login'
		};

	return {
		status: 403
	};
}

export function fixPools<T>(mission: T & { bombs: client.Bomb[] }): T & { bombs: Bomb[] } {
	return {
		...mission,
		bombs: mission.bombs.map((bomb) => {
			return {
				...bomb,
				pools: bomb.pools as unknown as Pool[]
			};
		})
	};
}

export function getSolveTypes(mission: Mission) {
	return {
		normalSolve: mission.completions.some((completion) => completion.team.length >= 2),
		efmSolve: mission.completions.some((completion) => completion.team.length == 1),
		soloSolve: mission.completions.some((completion) => completion.solo)
	};
}
