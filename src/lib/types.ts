export interface FrontendUser {
	id: string;
	username: string;
	discordName: string;
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
	RenameUser = 4,
	DownloadDatabase = 5
}

export type ID<T> = T & { id: number };

export interface MissionPack {
	name: string;
	steamId: string;
}

export type MissionPackSelection = Pick<ID<MissionPack>, 'id' | 'name'>;

export type MissionWithPack = Mission & { missionPack: MissionPackSelection | null };

export class Mission {
	name = '';
	authors: string[] = [];
	bombs: Bomb[] = [];
	completions: Completion[] = [];
	designedForTP = false;
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
	modules: string[]; //listed by Module ID, not name
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

export class IndividualCompletion {
	name: string = '';
	nDefuser = 0;
	nExpert = 0;
	nEFM = 0;
	nSolo = 0;
	defuser = false;
	expert = false;
	efm = false;
	solo = false;
}

export enum MustHave {
	Either = 0,
	Yes = 1,
	No = 2
}
export class HomeOptions {
	sortOrder = '';
	checks: { [k: string]: boolean } = {};
	modules: { [k: string]: any } = {};
	numMods = [1, 600];
	time = [1, 1600];
	strikes = [1, 150];
	widgets = [0, 40];
	numBombs = [1, 30];
	profPerc = [80];
	mustHave: { [k: string]: MustHave } = {};
}

export enum Operation {
	Expert = 0,
	Defuser = 1,
	Combined = 2
}

export type QueueItem = MissionQueueItem | CompletionQueueItem | MissionPackQueueItem;

export interface MissionQueueItem {
	type: 'mission';
	mission: ID<MissionWithPack>;
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
