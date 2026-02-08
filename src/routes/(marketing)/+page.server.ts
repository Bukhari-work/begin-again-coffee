import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const featuredItems = await sql`
        SELECT i.id, i.name, i.price, i.description, i.featured_rank, c.name as category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.featured_rank > 5
        ORDER BY featured_rank DESC
        LIMIT 3
    `;

	return { featuredItems };
};
