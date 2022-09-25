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
	VerifyMissionPack = 3,
	RenameUser = 4
}

export type ID<T> = T & { id: number };

export interface MissionPack {
	name: string;
	steamId: string;
}

export type MissionPackSelection = Pick<ID<MissionPack>, 'id' | 'name'>;

export class Mission {
	name = '';
	authors: string[] = [];
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
	modules: string[];	//listed by Module ID, not name
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

export enum MustHave {
	Either = 0,
	Yes = 1,
	No = 2
}
export class HomeOptions {
	sortOrder: string = '';
	checks: { [k:string]: boolean } = {};
	modules: { [k:string]: any } = {};
	numMods = [1, 600];
	time = [1,1500];
	strikes = [1,150];
	widgets = [0,40];
	profPerc = [80]
	mustHave: { [k:string]: MustHave } = {};
}

export enum Operation {
	Expert = 0,
	Defuser = 1,
	Combined = 2
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
