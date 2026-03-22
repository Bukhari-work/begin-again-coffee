import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const itemId = params.id;

	const [item, recipe, allIngredients] = await Promise.all([
		// 1. Get the Item Info
		sql`SELECT * FROM items WHERE id = ${itemId} LIMIT 1`,

		// 2. Get Recipe with COST DATA
		// We join 'view_ingredient_costs' to get the live price per gram/ml
		sql`
            SELECT
                r.ingredient_id,
                r.amount,
                i.name,
                i.unit,
                COALESCE(vic.cost_per_unit, 0) as cost_per_unit,
                (r.amount * COALESCE(vic.cost_per_unit, 0)) as total_cost
            FROM recipes r
            JOIN ingredients i ON r.ingredient_id = i.id
            LEFT JOIN view_ingredient_costs vic ON i.id = vic.ingredient_id
            WHERE r.item_variation_id = ${itemId}
            ORDER BY i.name ASC
        `,

		// 3. Get ingredients for dropdown (Ordered by name)
		// Also helpful to show unit cost in the dropdown
		sql`
            SELECT i.*, COALESCE(vic.cost_per_unit, 0) as current_cost
            FROM ingredients i
            LEFT JOIN view_ingredient_costs vic ON i.id = vic.ingredient_id
            ORDER BY i.name ASC
        `,
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

		if (!ingredientId || !amount) return fail(400, { missing: true });

		try {
			// Upsert: If ingredient exists, just update the amount
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
