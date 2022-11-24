import type { ID, Mission, Completion, MissionPack, Bomb } from '$lib/types';

export type EditMission = Omit<ID<Mission>, 'completions' | 'bombs'> & {
	bombs: ID<Bomb>[];
	completions: ID<Completion>[];
	missionPack: Pick<ID<MissionPack>, 'id' | 'name'>;
	variantOf: string;
	variant: number | null;
};
