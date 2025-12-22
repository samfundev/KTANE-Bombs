import type { ID, Mission, Completion, Bomb, MissionPackSelection, Season } from '$lib/types';

export type EditCompletion = ID<Completion> & {seasonName: string | null};

export type EditMission = Omit<ID<Mission>, 'completions' | 'bombs'> & {
	bombs: ID<Bomb>[];
	completions: EditCompletion[];
	missionPack: MissionPackSelection;
	variantOf: string;
	variant: number | null;
};
