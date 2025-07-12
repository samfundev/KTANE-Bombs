import type { RepoModule } from '$lib/repo';
import type { Mission } from '$lib/types.svelte';
import { getModule, withoutArticle } from '$lib/util';

export function sortBombs(mission: Mission, modules: Record<string, RepoModule> | null) {
	const getName = (id: string) => withoutArticle(getModule(id, modules).Name);

	for (const pool of mission.bombs.flatMap(bomb => bomb.pools)) {
		pool.modules.sort((a, b) => getName(a).localeCompare(getName(b)));
	}

	for (const bomb of mission.bombs) {
		bomb.pools.sort((a, b) => a.modules.map(getName).join().localeCompare(b.modules.map(getName).join()));
	}
}
