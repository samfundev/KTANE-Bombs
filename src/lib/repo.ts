export type RepoModule = {
	ModuleID: string;
	Name: string;
	RuleSeedSupport: string | null;
	X: number;
	Y: number;
};

type Cache = {
	modules: RepoModule[];
	timestamp: Date;
}

let cache: Cache | null = null;

export async function getData(): Promise<RepoModule[] | null> {
	if (cache === null || Date.now() - cache.timestamp.getTime() > 60 * 60 * 1000) {
		const repo = await fetch('https://ktane.timwi.de/json/raw');
		if (!repo.ok) return null;

		cache = {
			modules: (await repo.json()).KtaneModules,
			timestamp: new Date()
		};
	}

	return cache.modules;
}
