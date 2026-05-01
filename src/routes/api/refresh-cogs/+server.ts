import { json } from "@sveltejs/kit";
import sql from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
	// TypeScript now knows exactly what 'locals' is!
	const user = locals.user;

	// Authorization
	if (!user) return json({ success: false, error: "Unauthorized" }, { status: 401 });
	if (user.role !== "manager")
		return json({ success: false, error: "Forbidden" }, { status: 403 });

	try {
		// We call the function so the logic is shared with the pg_cron job.
		await sql`SELECT public.refresh_item_variation_cogs()`;

		return json({ success: true, message: "Margins synchronized." });
	} catch (err) {
		console.error("[COGS Refresh Error]:", err);

		// 1. Check if it's an object that contains a 'code' property
		if (err && typeof err === "object" && "code" in err) {
			// 2. Now TS knows 'err' has a 'code', but we should still be careful about its type.
			if (err.code === "55000") {
				return json(
					{
						success: false,
						error: "Sync already in progress. Please wait a few seconds.",
					},
					{ status: 409 }
				);
			}
		}

		return json({ success: false, error: "Internal server error." }, { status: 500 });
	}
};
