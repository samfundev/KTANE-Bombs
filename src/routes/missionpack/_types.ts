import type { ID, Mission, MissionPack } from '$lib/types.svelte';

export type EditMissionPack = ID<MissionPack> & { verified: boolean; missions: ID<Mission>[] };
