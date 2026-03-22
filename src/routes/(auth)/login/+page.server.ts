import { fail, redirect } from "@sveltejs/kit";
import sql from "$lib/server/db";
import bcrypt from "bcryptjs";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to determine where the user should go
const getDefaultRoute = (role: string) => {
	// Adjust these roles to match what you use in your database
	if (role === "admin" || role === "manager") {
		return "/dashboard";
	}
	return "/register"; // Cashiers and baristas go straight to the POS
};

// If already logged in, route them to their proper home
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, getDefaultRoute(locals.user.role));
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

		try {
			// 1. Fetch user
			const users = await sql`
                SELECT id, username, password_hash, role
                FROM users
                WHERE username = ${username}
                LIMIT 1
            `;
			const user = users[0];

			if (!user) {
				return fail(400, { error: "Invalid credentials" });
			}

			// 2. Verify Password
			const validPassword = await bcrypt.compare(password, user.password_hash);
			if (!validPassword) {
				return fail(400, { error: "Invalid credentials" });
			}

			// 3. Create Session
			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

			// 4. Database Transaction: Clean old sessions, insert new one
			await sql.begin(async (tx) => {
				await tx`DELETE FROM sessions WHERE user_id = ${user.id} AND expires_at < NOW()`;
				await tx`
                    INSERT INTO sessions (id, user_id, expires_at)
                    VALUES (${sessionId}, ${user.id}, ${expiresAt})
                `;
			});

			// 5. Set Cookie
			cookies.set("session", sessionId, {
				path: "/",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				expires: expiresAt,
			});

			// 6. Smart Redirect based on role
			throw redirect(303, getDefaultRoute(user.role));
		} catch (err) {
			// SvelteKit quirk: redirects are thrown as errors. We MUST re-throw them.
			if (err && typeof err === "object" && "status" in err && err.status === 303) {
				throw err;
			}

			console.error("Login Error:", err);
			return fail(500, { error: "An internal server error occurred" });
		}
	},

	logout: async ({ cookies }) => {
		const sessionId = cookies.get("session");

		if (sessionId) {
			try {
				// Remove from DB
				await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
			} catch (err) {
				console.error("Logout DB Error:", err);
				// We still want to delete the cookie even if the DB fails
			}
		}

		// Remove cookie
		cookies.delete("session", { path: "/" });
		throw redirect(303, "/login");
	},
};
