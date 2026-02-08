import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch items + categories for the dropdown
	const [items, categories] = await Promise.all([
		sql`
            SELECT i.id, i.name, i.price, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            ORDER BY i.id DESC
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

		if (!name || !price || !categoryId) {
			return fail(400, { missing: true });
		}

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
		const formData = await request.formData();
		const id = formData.get("id") as string;

		try {
			await sql`DELETE FROM items WHERE id = ${id}`;
			return { success: true };
		} catch {
			return fail(500, { error: "Could not delete item" });
		}
	},
};
