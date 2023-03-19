export type RepoModule = {
	BossStatus: string | null;
	ModuleID: string;
	Name: string;
	RuleSeedSupport: string | null;
	Type: string;
	Quirks: string | null;
	SteamID: string | null;
	X: number;
	Y: number;
};

type Cache = {
	modules: Record<string, RepoModule>;
	timestamp: Date;
};

let cache: Cache | null = null;

export async function getData(): Promise<Record<string, RepoModule> | null> {
	if (cache === null || Date.now() - cache.timestamp.getTime() > 60 * 60 * 1000) {
		const repo = await fetch('https://ktane.timwi.de/json/raw');
		if (!repo.ok) return null;

		cache = {
			modules: Object.fromEntries(
				(await repo.json()).KtaneModules.map((module: RepoModule) => [module.ModuleID, module])
			),
			timestamp: new Date()
		};
	}

	return cache.modules;
}
