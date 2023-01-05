import type { ID, Mission, Completion, Bomb, MissionPackSelection } from '$lib/types';

export type EditMission = Omit<ID<Mission>, 'completions' | 'bombs'> & {
	bombs: ID<Bomb>[];
	completions: ID<Completion>[];
	missionPack: MissionPackSelection;
	variantOf: string;
	variant: number | null;
};
