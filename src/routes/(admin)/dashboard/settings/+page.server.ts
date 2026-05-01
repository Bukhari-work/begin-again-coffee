import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private"; // Make sure to add this to .env!
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Security Check
	if (locals.user?.role !== "manager") {
		return { users: [], isManager: false };
	}

	// 2. Fetch Users from your new profiles table
	const users = await sql`
        SELECT id, username, role, created_at, is_active
        FROM profiles
        ORDER BY created_at ASC
    `;

	return { users, isManager: true };
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (locals.user?.role !== "manager") return fail(403, { error: "Unauthorized" });

		const data = await request.formData();
		const email = data.get("email") as string; // NEW: Required by Supabase
		const username = data.get("username") as string;
		const password = data.get("password") as string;
		const role = data.get("role") as string;

		if (!email || !username || !password) return fail(400, { missing: true });

		// Initialize the Admin Client using the Service Role Key
		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// We only make ONE call. Supabase handles the rest.
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				username: username,
				role: role,
			},
		});

		if (authError || !authData.user) {
			return fail(400, { error: authError?.message || "Failed to create user" });
		}

		return { success: true };
	},

	deleteUser: async ({ request, locals }) => {
		if (locals.user?.role !== "manager") return fail(403, { error: "Unauthorized" });

		const id = (await request.formData()).get("id") as string;

		// Prevent deleting yourself (Notice we don't need Number(id) anymore because UUIDs are strings!)
		if (id === locals.user?.id) {
			return fail(400, { error: "Cannot delete yourself" });
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// This is the magic of "ON DELETE CASCADE"!
		// We delete the user from Supabase Auth, and Postgres automatically wipes
		// their row from `public.profiles` for us.
		const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

		if (error) {
			return fail(500, { error: "Failed to delete user" });
		}

		return { success: true };
	},
};
