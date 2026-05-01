import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch Ingredients + Metadata + Current Cost
	// We order by category first to make grouping in the UI easier later
	const ingredients = await sql`
        SELECT
            i.id,
            i.name,
            i.unit,
            i.category,
            i.brand,
            i.type,
            i.is_active,
            COALESCE(vic.cost_per_unit, 0) as current_cost
        FROM ingredients i
        LEFT JOIN view_ingredient_costs vic ON i.id = vic.ingredient_id
        ORDER BY i.category ASC, i.name ASC
    `;

	return { ingredients };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const unit = formData.get("unit") as string;

		// Extract the new metadata fields
		const category = (formData.get("category") as string) || "Uncategorized";
		const brand = (formData.get("brand") as string) || null;
		const type = (formData.get("type") as string) || null;

		if (!name || !unit)
			return fail(400, { missing: true, error: "Name and unit are required" });

		try {
			await sql`
                INSERT INTO ingredients (name, unit, category, brand, type)
                VALUES (${name}, ${unit}, ${category}, ${brand}, ${type})
            `;
			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Database error during ingredient creation" });
		}
	},

	delete: async ({ request }) => {
		const id = (await request.formData()).get("id") as string;

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			// Because of ON DELETE CASCADE on the recipes table,
			// this safely removes the ingredient from all linked menu items automatically.
			await sql`DELETE FROM ingredients WHERE id = ${id}`;

			// Instantly sync the analytical engine so the COGS changes reflect everywhere
			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Could not delete ingredient" });
		}
	},
};
