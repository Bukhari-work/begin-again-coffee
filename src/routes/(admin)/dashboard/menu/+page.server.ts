import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// We group the new item_variation_cogs data directly inside the parent items
	// using PostgreSQL's json_agg, giving your Svelte UI a perfectly nested object.
	const [items, categories] = await Promise.all([
		sql`
            SELECT
                i.id,
                i.name,
                i.price as base_price,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', iv.id,
                            'name', iv.name,
                            'price', iv.price,
                            'cost', COALESCE(vc.total_cogs, 0),
                            'margin', COALESCE(vc.margin_percent, 100)
                        )
                    ) FILTER (WHERE iv.id IS NOT NULL), '[]'::json
                ) as variations
            FROM items i
            LEFT JOIN item_categories c ON i.category_id = c.id
            LEFT JOIN item_variations iv ON i.id = iv.item_id
            -- Use our new high-performance materialized view
            LEFT JOIN item_variation_cogs vc ON iv.id = vc.variation_id
            GROUP BY i.id, i.name, i.price, c.name
            ORDER BY c.name ASC, i.name ASC
        `,
		sql`SELECT * FROM item_categories ORDER BY name ASC`,
	]);

	return { items, categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const price = formData.get("price") as string;
		const categoryId = formData.get("category_id") as string;

		try {
			// 1. Create the abstract parent item and capture its ID
			const newItem = await sql`
                INSERT INTO items (name, price, category_id)
                VALUES (${name}, ${price}, ${categoryId})
                RETURNING id
            `;

			const insertedId = newItem[0].id;

			// 2. THE FIX: Immediately create a default physical variation (e.g., 'Regular')
			// This ensures the item can actually be added to 'order_items' and 'recipes'
			await sql`
                INSERT INTO item_variations (item_id, name, price)
                VALUES (${insertedId}, 'Regular', ${price})
            `;

			// Optional: If you want the Materialized View to instantly reflect this new variation
			// await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Database error during item creation" });
		}
	},

	delete: async ({ request }) => {
		const id = (await request.formData()).get("id") as string;
		try {
			// Because we set up `ON DELETE CASCADE` in the schema, deleting the
			// parent item here automatically destroys all linked variations and recipes!
			await sql`DELETE FROM items WHERE id = ${id}`;

			// Refresh the materialized view to remove the deleted items from the cache
			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Could not delete item" });
		}
	},
};
