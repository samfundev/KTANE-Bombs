import type { MissionWithPack } from '$lib/types.svelte';

export type ReplaceableMission = MissionWithPack & { replace: boolean; ids: string[] };
