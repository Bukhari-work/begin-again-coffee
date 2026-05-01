import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// 1. Fetch ingredients, ordered by category for better UI grouping
	const ingredients = await sql`
        SELECT id, name, unit, category
        FROM ingredients
        ORDER BY category ASC, name ASC
    `;

	// 2. Fetch history, and calculate the cost_per_unit on the fly so the
	//    manager can easily spot data-entry typos in the table.
	const history = await sql`
        SELECT
            p.*,
            i.name as ingredient_name,
            i.unit,
            (p.cost_total::numeric / NULLIF(p.quantity, 0)) as cost_per_unit
        FROM purchases p
        JOIN ingredients i ON p.ingredient_id = i.id
        ORDER BY p.purchase_date DESC, p.created_at DESC
        LIMIT 50
    `;

	return { ingredients, history };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const data = await request.formData();

		const ingredient_id = data.get("ingredient_id") as string;
		const quantity = data.get("quantity") as string;
		const cost_total = data.get("cost_total") as string;
		const supplier = data.get("supplier") as string | null;

		// Handle date default safely based on local timezone inputs
		const purchase_date =
			(data.get("purchase_date") as string) || new Date().toISOString().split("T")[0];

		if (!ingredient_id || !quantity || !cost_total) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			// 1. Insert the new financial ledger entry
			await sql`
                INSERT INTO purchases (ingredient_id, quantity, cost_total, supplier, purchase_date)
                VALUES (
                    ${ingredient_id},
                    ${quantity},
                    ${cost_total},
                    ${supplier},
                    ${purchase_date}
                )
            `;

			// 2. THE TRIGGER: Instantly recalculate all menu profit margins
			// Since view_ingredient_costs uses ORDER BY purchase_date DESC, it will
			// automatically pick up the row we just inserted as the new active cost!
			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Database error during purchase logging" });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get("id") as string;

		if (!id) return fail(400, { error: "Missing purchase ID" });

		try {
			// 1. Delete the erroneous record
			await sql`DELETE FROM purchases WHERE id = ${id}`;

			// 2. THE RECOVERY: Recalculate margins. The database will naturally
			// fall back to the second-most-recent purchase for its cost basis!
			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: "Could not delete purchase record" });
		}
	},
};
