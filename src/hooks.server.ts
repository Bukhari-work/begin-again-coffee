import type { Handle } from "@sveltejs/kit";
import sql from "$lib/server/db";

// Active UUID validation to protect the database from malformed queries
const isValidUuid = (id: string) =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get("session");

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	// 1. Fast Fail: Reject non-UUIDs immediately without querying the DB
	if (!isValidUuid(sessionId)) {
		event.cookies.delete("session", { path: "/" });
		event.locals.user = null;
		return resolve(event);
	}

	try {
		// 2. Query the active session
		const result = await sql`
            SELECT u.id, u.username, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ${sessionId} AND s.expires_at > NOW()
        `;

		if (result.length > 0) {
			// Use NonNullable to assure TypeScript this isn't the 'null' union type
			event.locals.user = result[0] as NonNullable<App.Locals["user"]>;
		} else {
			// Session expired or doesn't exist
			event.locals.user = null;
			event.cookies.delete("session", { path: "/" });
		}
	} catch (error) {
		console.error("Session validation error:", error);
		event.locals.user = null;
		event.cookies.delete("session", { path: "/" });
	}

	return resolve(event);
};
