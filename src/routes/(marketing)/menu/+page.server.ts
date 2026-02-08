import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	try {
		const menuItems = await sql`
            SELECT
                i.id,
                i.name,
                i.description,
                i.price,
                i.featured_rank,
                i.is_available,
                c.id as category_id,
                c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.is_available = true
            ORDER BY c.id, featured_rank DESC, i.name ASC
        `;

		return {
			menuItems,
		};
	} catch (error) {
		console.error("Database Error:", error);
		return { menuItems: [] };
	}
};
