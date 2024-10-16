export type RepoModule = {
	BossStatus: string | null;
	ModuleID: string;
	Name: string;
	Origin: string;
	Quirks: string | null;
	RuleSeedSupport: string | null;
	Published: string;
	Type: string;
	X: number;
	Y: number;
	FileName: string | null;
	TranslationOf: string | null;
	valid: boolean;
};

export type RepoManual = {
	Name: string;
	Descriptor: string | null;
	Language: string;
	TranslatedName: string | null;
	Author: string | null;
};

type ModuleCache = {
	modules: Record<string, RepoModule>;
	timestamp: Date;
};

type ManualCache = {
	manuals: RepoManual[];
	timestamp: Date;
};

let moduleCache: ModuleCache | null = null;
let manualCache: ManualCache | null = null;

export async function getData(): Promise<Record<string, RepoModule> | null> {
	if (moduleCache === null || Date.now() - moduleCache.timestamp.getTime() > 60 * 60 * 1000) {
		try {
			const repo = await fetch('https://ktane.timwi.de/json/raw');
			if (repo.ok) {
				moduleCache = {
					modules: Object.fromEntries(
						(await repo.json()).KtaneModules.map((module: RepoModule) => [module.ModuleID, module])
					),
					timestamp: new Date()
				};

				// Add FileName for translated modules
				for (const module of Object.values(moduleCache.modules)) {
					module.valid = true;
					if (!module.TranslationOf) continue;

					const translationOf = moduleCache.modules[module.TranslationOf];
					module.FileName = translationOf.FileName ?? translationOf.Name;
				}
			}
		} catch {}
	}

	return moduleCache?.modules ?? null;
}

export async function getRestrictedManuals(): Promise<RepoManual[] | null> {
	if (manualCache === null || Date.now() - manualCache.timestamp.getTime() > 60 * 60 * 1000) {
		try {
			const repo = await fetch('https://ktane.timwi.de/More/ChallengeBombRestrictedManuals.json');
			if (repo.ok) {
				manualCache = {
					manuals: (await repo.json()).Restricted.map((module: string) => {
						let row: (string | null)[] = [null, module, null, null, null];

						let match: RegExpMatchArray | null;
						if ((match = module.match(/(.+?)\\translated \((.+?) — (.+?)\) (.+) \((.+)\)/)) != null)
							row = [match[2], match[1], match[3], match[4], match[5]];
						else if ((match = module.match(/(.+?)\\translated \((.+?) — (.+?)\) (.+)/)) != null)
							row = [match[2], match[1], match[3], match[4], null];
						else if ((match = module.match(/(.+?)\\(.+) \((.+)\)/)) != null)
							row = [null, match[1], null, match[2], match[3]];
						else if ((match = module.match(/(.+?)\\(.+)/)) != null) row = [null, match[1], null, match[2], null];

						return {
							Language: row[0],
							Name: row[1],
							TranslatedName: row[2],
							Descriptor: row[3],
							Author: row[4]
						};
					}),
					timestamp: new Date()
				};
			}
		} catch {}
	}

	return manualCache?.manuals ?? null;
}
