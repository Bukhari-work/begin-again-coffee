import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	// Role Guard
	if (locals.user.role !== "manager") {
		redirect(303, "/register");
	}

	// Pass user info to the layout (for the Sidebar, "Hello Admin", etc.)
	return {
		user: {
			username: locals.user.username,
			role: locals.user.role,
		},
	};
};
