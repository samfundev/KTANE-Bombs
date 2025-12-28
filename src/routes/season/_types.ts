import type { Completion, ID, Season } from '$lib/types';
import { Mission } from '$lib/generated/prisma/client';

export type EditSeason = ID<Season> & { completions: ID<Completion & {mission: Mission}>[] };
