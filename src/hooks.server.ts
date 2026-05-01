import type { Handle } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
import sql from "$lib/server/db";

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Initialize Supabase
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch: event.fetch,
		},
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: "/" });
				});
			},
		},
	});

	// 2. Validate the JWT
	const {
		data: { user: authUser },
	} = await event.locals.supabase.auth.getUser();

	// 3. The Early Return Guard Clause
	if (!authUser) {
		event.locals.user = null;
		return resolve(event);
	}

	try {
		// 4. Check the JWT Metadata first!
		let role = authUser.user_metadata?.role;
		let username = authUser.user_metadata?.username;

		// 5. Only hit the DB if metadata is missing
		if (!role || !username) {
			console.log("JWT Metadata missing, fetching from DB");
			const result = await sql`
                SELECT username, role
                FROM public.profiles
                WHERE id = ${authUser.id}
                LIMIT 1
            `;

			if (result.length > 0) {
				username = result[0].username;
				role = result[0].role;
			}
		}

		// 6. Final Assignment
		if (role && username) {
			event.locals.user = { id: authUser.id, username, role } as NonNullable<
				App.Locals["user"]
			>;
		} else {
			event.locals.user = null;
		}
	} catch (error) {
		console.error("Profile fetch error:", error);
		event.locals.user = null;
	}

	// 7. Resolve the request
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === "content-range" || name === "x-supabase-api-version";
		},
	});
};
