import { getSeasonWinners } from "$lib/season";

export const load = async ({ locals }: any) => {
	return {
		user: locals.user,
		seasonWinners: await getSeasonWinners()
	};
};
