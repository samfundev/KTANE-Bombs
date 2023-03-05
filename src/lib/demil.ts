import semver from 'semver';

export interface Bomb {
	TimeLimit: number;
	NumStrikes: number;
	TimeBeforeNeedyActivation: number;
	FrontFaceOnly: boolean;
	OptionalWidgetCount: number;
	ComponentPools: string[][];
}

export interface Mission {
	Title: string;
	MissionID: string;
	Description: string;
	FactroyMode?: string;
	BombData: Bomb[];
	BombCount: number;
}

export interface Section {
	Title: string;
	SectionNum: number;
	Missions: Mission[];
}

export interface ToC {
	Title: string;
	Sections: Section[];
}

export interface MissionPack {
	SteamID: string;
	ModID: string;
	Title: string;
}

export interface VersionResult {
	Version: string;
}

export type MissionsResult = MissionPack[];
export interface LoadMissionOptions {
	refreshBinder?: boolean;
}
export type MissionDetailResult = MissionPack & { Missions: Mission[] };
export type ToCDetailResult = MissionPack & { ToCs: ToC[] };
export interface LoadMissionResult {
	LoadedMissions: string;
}
export interface StartMissionOptions {
	steamID?: string;
	seed?: number;
	force?: boolean;
}
export interface StartMissionByNameOptions {
	seed?: number;
	force?: boolean;
}

export interface StartMissionSuccessResult {
	MissionID: string;
	Seed: string;
}
export interface StartMissionMissingModulesResult {
	MissionID: string;
	MissingModules: string[];
}
export interface StartMissionTooManyModulesResult {
	MissionID: string;
	MaximumSupportedModulesCount: number;
	MissionModulesCount: number;
}
export interface StartMissionTooManyModulesFrontfaceResult {
	MissionID: string;
	MaximumSupportedFrontfaceModulesCount: number;
	MissionModulesCount: number;
}
export type StartMissionResult =
	| StartMissionSuccessResult
	| StartMissionMissingModulesResult
	| StartMissionTooManyModulesResult
	| StartMissionTooManyModulesFrontfaceResult;

export interface SaveAndDisableResult {
	SavedMissions: MissionPack[];
}

export interface DeMiLErrorResponse {
	ERROR: string;
	stacktrace?: string;
}

export enum CheckVersionResult {
	NOT_INSTALLED,
	INVALID_VERSION,
	OK
}

export class DeMiLError extends Error {
	public internalStack?: string;

	public constructor(obj: DeMiLErrorResponse) {
		super(obj.ERROR);
		this.internalStack = obj.stacktrace;
	}

	public static isDeMiLErrorResponse(obj: any): obj is DeMiLErrorResponse {
		return obj.hasOwnProperty('ERROR') && typeof obj['ERROR'] === 'string';
	}

	static modNotFoundRegex = /Mod with steamID (\d+) not found/;
	public static ParseIfErrorResponse(obj: any): DeMiLError | undefined {
		if (this.isDeMiLErrorResponse(obj)) {
			const modNotFoundMatch = obj.ERROR.match(DeMiLError.modNotFoundRegex);

			if (modNotFoundMatch !== null) {
				return new DeMiLModNotFoundError({ ...obj, steamID: modNotFoundMatch[1] });
			}
			return new DeMiLError(obj);
		}
		return;
	}
}

export class DeMiLModNotFoundError extends DeMiLError {
	public steamID?: string;

	public constructor(obj: DeMiLErrorResponse & { steamID: string }) {
		super(obj);
		this.steamID = obj.steamID;
	}
}

const versionRange = '2.x';

export class DeMiLClient {
	constructor(private port: number) {}

	/**
	 * List of all mission packs that are currently loaded, or saved in DeMiL setting file(Modsettings/DeMiLService.json). Please note that all unloaded mods can be loaded through following API even if they are not listed here, as long as they are already downloaded.
	 * @returns List of missions
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportmissions}
	 */
	async missions(): Promise<MissionsResult> {
		return this.get<MissionsResult>('missions');
	}

	/**
	 * Shows detail of the mission pack, as well as all the available missions. This also load the mod in game.
	 * @param steamID SteamID of the mission pack
	 * @param options Options for the query.
	 * @param options.refreshBinder If true, refresh the binder in the setup room. Default: true.
	 * @returns Mission pack information and list of missions
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportmissiondetailsteamidsteamid}
	 */
	async missionDetail(steamID: string, options: LoadMissionOptions = {}): Promise<MissionDetailResult> {
		return this.get<MissionDetailResult>('missionDetail', {
			steamID,
			refreshBinder: options.refreshBinder ? 'true' : 'false'
		});
	}

	/**
	 * Shows detail of the mission pack, the table of contents, sections and mission detail. This also load the mod in game.
	 * @param steamID SteamID of the mission pack
	 * @param options Options for the query.
	 * @param options.refreshBinder If true, refresh the binder in the setup room. Default: true.
	 * @returns Mission pack information and list of table of contents
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostporttocdetailsteamidsteamid}
	 */
	async tocDetail(steamID: string, options: LoadMissionOptions = {}): Promise<ToCDetailResult> {
		return this.get<ToCDetailResult>('tocDetail', {
			steamID,
			refreshBinder: options.refreshBinder ? 'true' : 'false'
		});
	}

	/**
	 * Loads the mod in game.
	 * @param steamID SteamID of the mission pack
	 * @param options Options for the query.
	 * @param options.refreshBinder If true, refresh the binder in the setup room. Default: true.
	 * @returns Loaded mod's steamID
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportloadmissionsteamidsteamid}
	 */
	async loadMission(steamID: string, options: LoadMissionOptions = {}): Promise<LoadMissionResult> {
		return this.get<LoadMissionResult>('loadMission', {
			steamID,
			refreshBinder: options.refreshBinder ? 'true' : 'false'
		});
	}

	/**
	 * Start the mission with specified mission ID.
	 * @param missionID missionID for the mission
	 * @param options Options to start the mission.
	 * @param options.steamID Load the specified mod before starting the mission.
	 * @param options.seed Specify mission seed.
	 * @param options.force Start the mission without checking the mission can be run in the current setting. Default: false
	 * @returns Mission ID and seed
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportstartmissionmissionidmissionid}
	 */
	async startMission(missionID: string, options: StartMissionOptions = {}): Promise<StartMissionResult> {
		const parsedOptions = Object.fromEntries(
			Object.entries({
				...options,
				seed: options.seed?.toString(),
				force: options.force ? 'true' : 'false',
				missionID
			}).filter((kvp): kvp is [string, string] => typeof kvp[1] === 'string')
		);

		const result = await this.get<StartMissionResult>('startMission', parsedOptions);
		if (result.hasOwnProperty('MaximumSupportedFrontfaceModulesCount')) {
			(result as StartMissionTooManyModulesResult).MaximumSupportedModulesCount = (
				result as StartMissionTooManyModulesFrontfaceResult
			).MaximumSupportedFrontfaceModulesCount;
		}

		return result;
	}

	/**
	 * Start the mission with specified mission name.
	 * @param missionName Mission name for the mission. If mission with the exact name exist, or there are only one mission that partially match the name, the mission will be activated.
	 * @param steamID SteamID of the mission pack that the mission is in.
	 * @param options Options to start the mission.
	 * @param options.seed Specify mission seed.
	 * @param options.force Start the mission without checking the mission can be run in the current setting. Default: false
	 * @returns Mission ID and seed
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportstartmissionmissionidmissionid}
	 */
	async startMissionByName(
		missionName: string,
		steamID: string,
		options: StartMissionByNameOptions = {}
	): Promise<StartMissionResult> {
		const parsedOptions = Object.fromEntries(
			Object.entries({
				...options,
				seed: options.seed?.toString(),
				force: options.force ? 'true' : 'false',
				missionName,
				steamID
			}).filter((kvp): kvp is [string, string] => typeof kvp[1] === 'string')
		);

		return this.get<StartMissionResult>('startMission', parsedOptions);
	}

	/**
	 * Save mission pack data to the DeMiL setting file(Modsettings/DeMiLService.json), and disables the mods. The game will enter the mod manager and leave immidiately. This is only possible in setup room.
	 * @returns List of diabled missions
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportsaveanddisable}
	 */
	async saveAndDisable(): Promise<SaveAndDisableResult> {
		return this.get<SaveAndDisableResult>('saveAndDisable');
	}

	/**
	 * Get current installed version of DeMiL.
	 * @returns Version
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportversion}
	 */
	async version(): Promise<VersionResult> {
		return this.get<VersionResult>('version');
	}

	/**
	 * Check if current version of DeMiL is OK to use.
	 * @param range Range of acceptable versions. @see {@link https://github.com/npm/node-semver#ranges} Default: 2.x
	 * @returns CheckVersionResult.NOT_INSTALLED if DeMiL is not installed. CheckVersionResult.INVALID_VERSION if the version is not in the range. Otherwise CheckVersionResult.OK.
	 * @see {@link https://github.com/tepel-chen/DeMiLService/wiki/API-Reference#httplocalhostportversion}
	 */
	async checkVersion(range: string = versionRange): Promise<CheckVersionResult> {
		try {
			const version = (await this.version()).Version;
			if (semver.satisfies(version, range)) {
				return CheckVersionResult.OK;
			} else {
				return CheckVersionResult.INVALID_VERSION;
			}
		} catch {
			return CheckVersionResult.NOT_INSTALLED;
		}
	}

	private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
		const urlParams = new URLSearchParams(params);
		const url = new URL('http://localhost');
		url.port = this.port.toString();
		url.pathname = path;
		url.search = urlParams.toString();

		const data = await (await fetch(url)).json();
		const demilError = DeMiLError.ParseIfErrorResponse(data);
		if (demilError) throw demilError;
		return data;
	}

	/**
	 * Check if StartMissionResult was successful
	 * @param result
	 * @returns true if tartMissionResult was successful
	 */
	static isStartMissionSuccess(result: StartMissionResult): result is StartMissionSuccessResult {
		return result.hasOwnProperty('Seed');
	}
}
