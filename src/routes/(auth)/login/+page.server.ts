import { fail, redirect, isRedirect } from "@sveltejs/kit";
import sql from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types";

const getDefaultRoute = (role: string) => {
	if (role === "manager") {
		return "/dashboard";
	}
	return "/kiosk";
};

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, getDefaultRoute(locals.user.role));
	}
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get("email") as string;
		const password = data.get("password") as string;

		if (!email || !password) {
			return fail(400, { error: "Missing email or password" });
		}

		try {
			// 1. Supabase Auth
			const { data: authData, error: authError } =
				await locals.supabase.auth.signInWithPassword({
					email,
					password,
				});

			if (authError || !authData.user) {
				console.error("Supabase Auth Error:", authError?.message);
				return fail(400, { error: "Invalid credentials" });
			}

			// 2. Read the role directly from the token, skipping the DB if possible!
			let role = authData.user.user_metadata?.role;

			// 3. Only hit Postgres if the metadata is completely missing
			if (!role) {
				const result = await sql`
                    SELECT role FROM public.profiles WHERE id = ${authData.user.id} LIMIT 1
                `;
				role = result.length > 0 ? result[0].role : "barista";
			}

			// 4. Smart Redirect
			redirect(303, getDefaultRoute(role));
		} catch (err) {
			if (isRedirect(err)) {
				throw err;
			}

			console.error("Login Error:", err);
			return fail(500, { error: "An internal server error occurred" });
		}
	},

	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, "/login");
	},
};
