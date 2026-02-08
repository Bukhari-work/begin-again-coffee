import type { Handle } from "@sveltejs/kit";
import sql from "$lib/server/db";

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get("session");

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const result = await sql`
        SELECT u.id, u.username, u.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `;

	if (result.length > 0) {
		// FIX: Cast the generic 'Row' to your specific User type
		event.locals.user = result[0] as { id: number; username: string; role: string };
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
