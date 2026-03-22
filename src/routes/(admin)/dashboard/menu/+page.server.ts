import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch Menu Items + Categories + COGS
	// We use the 'item_cogs' view to check profitability instantly
	const [items, categories] = await Promise.all([
		sql`
            SELECT
                i.id, i.name, i.price,
                c.name as category_name,
                COALESCE(ic.base_cogs, 0) as cost,
                COALESCE(ic.margin_percent, 100) as margin
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_cogs ic ON i.id = ic.item_id
            ORDER BY i.name ASC
        `,
		sql`SELECT * FROM categories ORDER BY name ASC`,
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
			await sql`
                INSERT INTO items (name, price, category_id)
                VALUES (${name}, ${price}, ${categoryId})
            `;
			return { success: true };
		} catch {
			return fail(500, { error: "Database error" });
		}
	},

	delete: async ({ request }) => {
		const id = (await request.formData()).get("id") as string;
		try {
			await sql`DELETE FROM items WHERE id = ${id}`;
			return { success: true };
		} catch {
			return fail(500, { error: "Could not delete" });
		}
	},
};
