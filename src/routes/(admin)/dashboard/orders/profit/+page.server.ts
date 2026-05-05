import sql from "$lib/server/db";
import type { PageServerLoad } from "../profit/$types";

export const load: PageServerLoad = async () => {
	// Fetch Unit Economics
	// Sorted by Margin ASC (Low margin items first = Problem items)
	const analysis = await sql`
        SELECT * FROM item_variation_cogs
        ORDER BY margin_percent ASC, item_name ASC
    `;

	return { analysis };
};
