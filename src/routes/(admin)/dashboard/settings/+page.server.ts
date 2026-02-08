import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import bcrypt from "bcryptjs";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Security Check: Only Managers can see the user list
	if (locals.user?.role !== "manager") {
		return { users: [], isManager: false };
	}

	// 2. Fetch Users (Exclude password_hash for security)
	const users = await sql`
        SELECT id, username, role, created_at, is_active
        FROM users
        ORDER BY created_at ASC
    `;

	return { users, isManager: true };
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (locals.user?.role !== "manager") return fail(403, { error: "Unauthorized" });

		const data = await request.formData();
		const username = data.get("username") as string;
		const password = data.get("password") as string;
		const role = data.get("role") as string;

		if (!username || !password) return fail(400, { missing: true });

		// Hash password
		const hash = await bcrypt.hash(password, 10);

		try {
			await sql`
                INSERT INTO users (username, password_hash, role)
                VALUES (${username}, ${hash}, ${role})
            `;
			return { success: true };
		} catch {
			return fail(500, { error: "Username likely taken" });
		}
	},

	deleteUser: async ({ request, locals }) => {
		if (locals.user?.role !== "manager") return fail(403, { error: "Unauthorized" });

		const id = (await request.formData()).get("id") as string;

		// Prevent deleting yourself
		if (Number(id) === locals.user?.id) {
			return fail(400, { error: "Cannot delete yourself" });
		}

		await sql`DELETE FROM users WHERE id = ${id}`;
		return { success: true };
	},
};
