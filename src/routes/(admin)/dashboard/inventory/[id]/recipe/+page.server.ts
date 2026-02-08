import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const itemId = params.id;

	const [item, recipe, allIngredients] = await Promise.all([
		// 1. Get the Item Name
		sql`SELECT * FROM items WHERE id = ${itemId} LIMIT 1`,

		// 2. Get the Current Recipe (Joined with Ingredients table)
		sql`
            SELECT r.ingredient_id, r.amount, i.name, i.unit
            FROM recipes r
            JOIN ingredients i ON r.ingredient_id = i.id
            WHERE r.item_id = ${itemId}
        `,

		// 3. Get list of all ingredients for the dropdown
		sql`SELECT * FROM ingredients ORDER BY name ASC`,
	]);

	if (!item.length) throw new Error("Item not found");

	return {
		item: item[0],
		recipe,
		allIngredients,
	};
};

export const actions: Actions = {
	addIngredient: async ({ request, params }) => {
		const formData = await request.formData();

		const ingredientId = formData.get("ingredient_id") as string;
		const amount = formData.get("amount") as string;
		const itemId = params.id;

		// Simple server-side validation
		if (!ingredientId || !amount) {
			return fail(400, { missing: true });
		}

		try {
			await sql`
                INSERT INTO recipes (item_id, ingredient_id, amount)
                VALUES (${itemId}, ${ingredientId}, ${amount})
                ON CONFLICT (item_id, ingredient_id)
                DO UPDATE SET amount = EXCLUDED.amount
            `;
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: "Error saving recipe" });
		}
	},

	removeIngredient: async ({ request, params }) => {
		const formData = await request.formData();

		const ingredientId = formData.get("ingredient_id") as string;
		const itemId = params.id;

		await sql`
            DELETE FROM recipes
            WHERE item_id = ${itemId} AND ingredient_id = ${ingredientId}
        `;
		return { success: true };
	},
};
