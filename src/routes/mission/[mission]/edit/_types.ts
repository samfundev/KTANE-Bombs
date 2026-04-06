import type { ID, Mission, Bomb, MissionPackSelection, SeasonCompletion } from '$lib/types';

export type EditCompletion = ID<SeasonCompletion> & { seasonName: string | null };

export type EditMission = Omit<ID<Mission>, 'completions' | 'bombs'> & {
	bombs: ID<Bomb>[];
	completions: EditCompletion[];
	missionPack: MissionPackSelection;
	variantOf: string;
	variant: number | null;
};
