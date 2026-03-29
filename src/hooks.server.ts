import type { Handle } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
import sql from "$lib/server/db";

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Initialize the Supabase Auth client for this specific request
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: "/",
						secure: event.url.protocol === "https:",
					});
				});
			},
		},
	});

	// 2. Cryptographically verify the session token (Safe for Server-Side Rendering)
	const {
		data: { user },
		error: authError,
	} = await event.locals.supabase.auth.getUser();

	if (user && !authError) {
		try {
			// 3. Fetch app-specific data directly via postgres.js
			const result = await sql`
                SELECT username, role
                FROM public.profiles
                WHERE id = ${user.id}
                LIMIT 1
            `;

			if (result.length > 0) {
				// 4. Populate locals so your +layout.server.ts guards can read it
				event.locals.user = {
					id: user.id,
					username: result[0].username,
					role: result[0].role,
				};
			} else {
				// User authenticated, but no profile found in the database
				event.locals.user = null;
			}
		} catch (error) {
			console.error("Failed to fetch user profile:", error);
			event.locals.user = null;
		}
	} else {
		// No valid session token
		event.locals.user = null;
	}

	// 5. Resolve the SvelteKit request
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === "content-range" || name === "x-supabase-api-version";
		},
	});
};
