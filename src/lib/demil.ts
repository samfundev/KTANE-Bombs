import semver from 'semver';
export interface StartMissionOptions {
	steamID?: string;
	seed?: number;
	force?: boolean;
}
export interface StartMissionByNameOptions {
	seed?: number;
	force?: boolean;
}

export interface DeMiLResultBase {
	Version?: string;
	IsVersionInRange?: boolean;
}

export interface StartMissionSuccessResult extends DeMiLResultBase {
	MissionID: string;
	Seed: string;
}
export interface StartMissionMissingModulesResult extends DeMiLResultBase {
	MissionID: string;
	MissingModules: string[];
}
export interface StartMissionTooManyModulesResult extends DeMiLResultBase {
	MissionID: string;
	MaximumSupportedModulesCount: number;
	MissionModulesCount: number;
}
export interface StartMissionTooManyModulesFrontfaceResult extends DeMiLResultBase {
	MissionID: string;
	MaximumSupportedFrontfaceModulesCount: number;
	MissionModulesCount: number;
}
export interface StartMissionTooManyBombsResult extends DeMiLResultBase {
	MissionID: string;
	MaximumSupportedBombsCount: number;
	MissionBombsCount: number;
}
export type StartMissionResult =
	| StartMissionSuccessResult
	| StartMissionMissingModulesResult
	| StartMissionTooManyModulesResult
	| StartMissionTooManyModulesFrontfaceResult
	| StartMissionTooManyBombsResult;

export interface DeMiLErrorResponse extends DeMiLResultBase {
	ERROR: string;
	Stacktrace?: string;
}

export class DeMiLError extends Error {
	public internalStack?: string;
	public version?: string;
	public isVersionInRange: boolean;

	public constructor(obj: DeMiLErrorResponse) {
		super(obj.ERROR);
		this.internalStack = obj.Stacktrace;
		this.version = obj.Version;
		this.isVersionInRange = obj.IsVersionInRange ?? false;
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

const versionRange = '>=2.1.1';

export class DeMiLClient {
	constructor(private port: number) {}

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

	private async get<T extends DeMiLResultBase>(path: string, params: Record<string, string> = {}): Promise<T> {
		const urlParams = new URLSearchParams(params);
		const url = new URL('http://localhost');
		url.port = this.port.toString();
		url.pathname = path;
		url.search = urlParams.toString();

		const data: DeMiLResultBase = await (await fetch(url)).json();

		if (typeof data.Version === 'string' && semver.satisfies(data.Version, versionRange)) {
			data.IsVersionInRange = true;
		} else {
			data.IsVersionInRange = false;
		}

		const demilError = DeMiLError.ParseIfErrorResponse(data);
		if (demilError) throw demilError;
		return data as T;
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
