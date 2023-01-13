import type { ID, Mission, MissionPack } from '$lib/types';

export type EditMissionPack = ID<MissionPack> & { verified: boolean; missions: ID<Mission>[] };
