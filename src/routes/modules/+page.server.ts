import client from '$lib/client';
import { getData } from '$lib/repo';
import type { Bomb } from '$lib/types';
import { allSpecialModules, getModule, onlyUnique } from '$lib/util';

export const load = async function () {
	const missions = await client.mission.findMany({
		where: {
			verified: true
		},
		select: {
			name: true,
			bombs: true
		}
	});
	const modules = (await getData()) ?? {};
	allSpecialModules.forEach(mod => {
		modules[mod] = getModule(mod, modules);
	});

	const missionsOf: Record<string, string[]> = {};
	missions.forEach(miss => {
		miss.bombs
			.map((b: Bomb) => b.pools.map(p => p.modules.filter(onlyUnique)))
			.flat(2)
			.map((m: string) => getModule(m, modules))
			.forEach((mod: RepoModule) => {
				if (missionsOf[mod.ModuleID] == undefined) {
					missionsOf[mod.ModuleID] = [miss.name];
				} else if (!missionsOf[mod.ModuleID].some(mission => mission === miss.name)) {
					missionsOf[mod.ModuleID].push(miss.name);
				}
			});
	});

	for (const modID in missionsOf) {
		missionsOf[modID].sort((a, b) => a.localeCompare(b));
	}

	const simpleModules = {};
	for (const [key, module] of Object.entries(modules)) {
		simpleModules[key] = {
			ModuleID: module.ModuleID,
			Name: module.Name,
			Published: module.Published,
			Type: module.Type,
			X: module.X,
			Y: module.Y,
			valid: module.valid,
			BossStatus: module.BossStatus,
			Quirks: module.Quirks,
			FileName: module.FileName
		};
	}

	return {
		missionsOf,
		modules: simpleModules
	};
};
