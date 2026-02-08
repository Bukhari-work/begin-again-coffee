import { fail, redirect } from "@sveltejs/kit";
import sql from "$lib/server/db";
import bcrypt from "bcryptjs";
import type { Actions, PageServerLoad } from "./$types";

// If already logged in, redirect to dashboard
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, "/dashboard");
	}
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get("username") as string;
		const password = data.get("password") as string;

		if (!username || !password) {
			return fail(400, { error: "Missing username or password" });
		}

		// 1. Fetch user
		const users = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
		const user = users[0];

		if (!user) {
			// Security: Don't reveal if user exists
			return fail(400, { error: "Invalid credentials" });
		}

		// 2. Verify Password
		const validPassword = await bcrypt.compare(password, user.password_hash);
		if (!validPassword) {
			return fail(400, { error: "Invalid credentials" });
		}

		// 3. Create Session
		const sessionId = crypto.randomUUID();
		// Set expiry to 24 hours from now
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

		await sql`
            INSERT INTO sessions (id, user_id, expires_at)
            VALUES (${sessionId}, ${user.id}, ${expiresAt})
        `;

		// 4. Set Cookie
		cookies.set("session", sessionId, {
			path: "/",
			httpOnly: true, // JS cannot access this (XSS protection)
			secure: process.env.NODE_ENV === "production", // HTTPS only in prod
			sameSite: "lax",
			expires: expiresAt,
		});

		throw redirect(303, "/dashboard");
	},

	logout: async ({ cookies }) => {
		const sessionId = cookies.get("session");
		if (sessionId) {
			// Remove from DB
			await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
		}
		// Remove cookie
		cookies.delete("session", { path: "/" });
		throw redirect(303, "/login");
	},
};
