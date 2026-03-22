import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch ingredients for the dropdown
	const ingredients = await sql`SELECT id, name, unit FROM ingredients ORDER BY name ASC`;

	// Fetch recent purchase history
	const history = await sql`
        SELECT p.*, i.name as ingredient_name, i.unit
        FROM purchases p
        JOIN ingredients i ON p.ingredient_id = i.id
        ORDER BY p.purchase_date DESC, p.created_at DESC
        LIMIT 20
    `;

	return { ingredients, history };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const data = await request.formData();

		// FIX: Cast these as 'string' so TypeScript knows they aren't Files
		const ingredient_id = data.get("ingredient_id") as string;
		const quantity = data.get("quantity") as string;
		const total_cost = data.get("total_cost") as string;

		// For optional text, use 'as string | null'
		const supplier = data.get("supplier") as string | null;

		// Handle date default
		const purchase_date =
			(data.get("purchase_date") as string) || new Date().toISOString().split("T")[0];

		if (!ingredient_id || !quantity || !total_cost) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			await sql`
                INSERT INTO purchases (ingredient_id, quantity, total_cost, supplier, purchase_date)
                VALUES (
                    ${ingredient_id},
                    ${quantity},
                    ${total_cost},
                    ${supplier},
                    ${purchase_date}
                )
            `;
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: "Database error" });
		}
	},
};
