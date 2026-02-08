import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const ingredients = await sql`SELECT * FROM ingredients ORDER BY name ASC`;
	return { ingredients };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const unit = formData.get("unit") as string; // e.g., 'grams', 'ml', 'shots'

		if (!name || !unit) return fail(400, { missing: true });

		try {
			await sql`INSERT INTO ingredients (name, unit) VALUES (${name}, ${unit})`;
			return { success: true };
		} catch {
			return fail(500, { error: "Database error" });
		}
	},

	delete: async ({ request }) => {
		const id = (await request.formData()).get("id") as string;
		try {
			await sql`DELETE FROM ingredients WHERE id = ${id}`;
			return { success: true };
		} catch {
			return fail(500, { error: "In use by a recipe" });
		}
	},
};
