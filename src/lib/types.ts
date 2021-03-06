export interface FrontendUser {
	id: string;
	username: string;
	avatar: string;
	permissions: Permission[];
}

// Be careful when changing this enum.
// User's permissions are stored by integer.
export enum Permission {
	ModifyPermissions = 0,
	VerifyMission = 1,
	VerifyCompletion = 2,
	VerifyMissionPack = 3
}

export type ID<T> = T & { id: number };

export interface MissionPack {
	name: string;
	author: string;
	steamId: string;
}

export type MissionPackSelection = Pick<ID<MissionPack>, 'id' | 'name'>;

export class Mission {
	name = '';
	bombs: Bomb[] = [];
	completions: Completion[] = [];
	tpSolve = false;
	factory: string | null = null;
}

export class Bomb {
	modules = 0;
	time = 0;
	strikes = 0;
	widgets = 0;
	pools: Pool[] = [];
}

export class Pool {
	modules: string[];
	count: number;

	constructor(modules: string[], count: number) {
		this.modules = modules;
		this.count = count;
	}
}

export class Completion {
	proofs: string[] = [];
	time = 0;
	team: string[] = [];
	first = false;
	old = false;
	solo = false;
}

export type QueueItem = MissionQueueItem | CompletionQueueItem | MissionPackQueueItem;

export interface MissionQueueItem {
	type: 'mission';
	mission: ID<Mission>;
}

export interface CompletionQueueItem {
	type: 'completion';
	completion: ID<Completion>;
	mission: ID<Mission>;
}

export interface MissionPackQueueItem {
	type: 'missionpack';
	pack: ID<MissionPack>;
}

export interface Completer {
	name: string;
	distinct: number;
	defuser: number;
	expert: number;
	efm: number;
}
