import type { MissionWithPack } from '$lib/types';

export type ReplaceableMission = MissionWithPack & { replace: boolean };
