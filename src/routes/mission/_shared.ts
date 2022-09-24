import type { RepoModule } from '$lib/repo';
import type { Mission } from '$lib/types';

export function getModule(moduleID: string, modules: RepoModule[] | null) {
	const module = modules?.filter((module) => module.ModuleID == moduleID);
	if (module?.length === 1) {
		return module[0];
	}

	return {
		Name: moduleID,
		ModuleID: moduleID,
		RuleSeedSupport: null,
		X: 0,
		Y: 0
	};
}

export function sortBombs(mission: Mission, modules: RepoModule[] | null) {
	const getName = (id: string) => getModule(id, modules).Name;

	for (const pool of mission.bombs.flatMap((bomb) => bomb.pools)) {
		pool.modules.sort((a, b) => getName(a).localeCompare(getName(b)));
	}

	for (const bomb of mission.bombs) {
		bomb.pools.sort((a, b) =>
			a.modules.map(getName).join().localeCompare(b.modules.map(getName).join())
		);
	}
}
