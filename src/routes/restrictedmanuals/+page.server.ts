import { getRestrictedManuals } from '$lib/repo';

export const load = async function () {
	return {
		manuals: getRestrictedManuals()
	};
};
