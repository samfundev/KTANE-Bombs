<script lang="ts">
	import { Permission, type FrontendUser } from '$lib/types';
	import { applyAction } from '$app/forms';

	export let shownUser: FrontendUser;

	const permissions: Record<string, number> = {};
	for (const [name, value] of Object.entries(Permission)) {
		if (typeof value === 'string') {
			continue;
		}

		permissions[name] = value;
	}
	let newPermissions = new Set(shownUser.permissions);

	function togglePermission(permission: number) {
		if (newPermissions.has(permission)) {
			newPermissions.delete(permission);
		} else {
			newPermissions.add(permission);
		}

		newPermissions = newPermissions;
	}

	$: modified =
		shownUser.permissions.length != newPermissions.size ||
		shownUser.permissions.some(permission => !newPermissions.has(permission));

	async function saveChanges() {
		const fData = new FormData();
		fData.append('perms', JSON.stringify(Array.from(newPermissions)));
		fData.append('user', shownUser.id);
		const response = await fetch(`?/editPermissions`, {
			method: 'POST',
			body: fData
		});
		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = await response.json();

		applyAction(result);
		shownUser.permissions = Array.from(newPermissions);
	}
</script>

<div class="block flex column content-width">
	<div class="flex">
		{#each Object.entries(permissions) as [name, value]}
			<input type="checkbox" id={name} checked={newPermissions.has(value)} on:change={() => togglePermission(value)} />
			<label for={name}>{name}</label>
		{/each}
	</div>
	<button disabled={!modified} on:click={saveChanges}>Save Changes</button>
</div>
