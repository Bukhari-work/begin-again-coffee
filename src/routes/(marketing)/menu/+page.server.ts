import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const prerender = true;

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
                i.image_url,
                c.id as category_id,
                c.name as category_name
            FROM items i
            LEFT JOIN item_categories c ON i.category_id = c.id
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
