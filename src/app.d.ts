/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {
		user: import('$lib/types.svelte').FrontendUser | null;
		token: string | null;
	}

	// interface Platform {}

	// interface Stuff {}
}
