import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const itemId = Number(params.id);

	// 1. Parent item
	const itemPromise = sql`
        SELECT * FROM public.items
        WHERE id = ${itemId}
        LIMIT 1
    `;

	// 2. Variations + recipe
	const variationsPromise = sql`
        SELECT
            iv.id,
            iv.name AS variation_name,
            iv.price,
            iv.is_available,

            COALESCE(
                json_agg(
                    json_build_object(
                        'ingredient_id', ing.id,
                        'name', ing.name,
                        'unit', ing.unit,
                        'amount', r.amount,
                        'cost_per_unit', COALESCE(vic.cost_per_unit, 0),
                        'total_cost', r.amount * COALESCE(vic.cost_per_unit, 0)
                    )
                    ORDER BY ing.name
                ) FILTER (WHERE ing.id IS NOT NULL),
                '[]'::json
            ) AS recipe

        FROM public.item_variations iv
        LEFT JOIN public.recipes r ON iv.id = r.item_variation_id
        LEFT JOIN public.ingredients ing ON r.ingredient_id = ing.id
        LEFT JOIN public.view_ingredient_costs vic ON ing.id = vic.ingredient_id

        WHERE iv.item_id = ${itemId}
        GROUP BY iv.id
        ORDER BY iv.id
    `;

	// 3. Cost snapshot (from materialized view)
	const cogsPromise = sql`
        SELECT
            variation_id,
            base_cogs,
            modifier_cogs,
            total_cogs,
            margin_percent
        FROM public.item_variation_cogs
        WHERE variation_id IN (
            SELECT id FROM public.item_variations WHERE item_id = ${itemId}
        )
    `;

	// 4. Resolved modifier groups + modifiers (NO cost duplication)
	const modifiersPromise = sql`
        WITH resolved_rules AS (
            SELECT i.id AS item_id, mgr.group_id
            FROM public.items i
            JOIN public.modifier_group_rules mgr ON mgr.item_id = i.id

            UNION

            SELECT i.id AS item_id, mgr.group_id
            FROM public.modifier_group_rules mgr
            JOIN public.items i ON mgr.category_id = i.category_id
        )

        SELECT
            i.id AS item_id,
            json_agg(
                json_build_object(
                    'group_id', mg.id,
                    'group_name', mg.name,
                    'min_selections', mg.min_selections,
                    'max_selections', mg.max_selections,
                    'modifiers', (
                        SELECT json_agg(
                            json_build_object(
                                'modifier_id', m.id,
                                'name', m.name,
                                'price_adjustment', m.price_adjustment,
                                'quantity', m.quantity,
                                'behavior', m.behavior,
                                -- THE UPGRADE: Per-modifier economics
                                'cogs', COALESCE(m.quantity * vic.cost_per_unit, 0),
                                'profit', m.price_adjustment - COALESCE(m.quantity * vic.cost_per_unit, 0)
                            )
                            ORDER BY m.name
                        )
                        FROM public.modifiers m
                        -- THE UPGRADE: Join the cost view right here
                        LEFT JOIN public.view_ingredient_costs vic ON m.ingredient_id = vic.ingredient_id
                        WHERE m.group_id = mg.id
                          AND m.is_available = true
                    )
                )
            ) AS modifier_groups

        FROM public.items i
        JOIN resolved_rules rr ON rr.item_id = i.id
        JOIN public.modifier_groups mg ON mg.id = rr.group_id

        WHERE i.id = ${itemId}
        GROUP BY i.id
    `;

	// 5. Ingredient dropdown
	const ingredientsPromise = sql`
        SELECT
            i.id,
            i.name,
            i.unit,
            COALESCE(vic.cost_per_unit, 0) AS current_cost
        FROM public.ingredients i
        LEFT JOIN public.view_ingredient_costs vic
            ON i.id = vic.ingredient_id
        WHERE i.is_active = true
        ORDER BY i.name
    `;

	// THE FIX: All 5 promises are executed concurrently
	const [itemResult, variationsResult, cogsResult, modifiersResult, ingredientsResult] =
		await Promise.all([
			itemPromise,
			variationsPromise,
			cogsPromise,
			modifiersPromise,
			ingredientsPromise, // Added to the array
		]);

	if (!itemResult.length) {
		throw new Error("Item not found");
	}

	// --- Map COGS ---
	const cogsMap = new Map(cogsResult.map((c) => [c.variation_id, c]));

	// --- Modifier groups (same for all variations of item) ---
	const modifierGroups = modifiersResult[0]?.modifier_groups ?? [];

	// --- Merge everything ---
	const variations = variationsResult.map((v) => {
		const cogs = cogsMap.get(v.id);

		return {
			...v,
			modifier_groups: modifierGroups,

			base_cogs: Number(cogs?.base_cogs ?? 0),
			modifier_cogs: Number(cogs?.modifier_cogs ?? 0),
			total_cogs: Number(cogs?.total_cogs ?? 0),
			margin_percent: Number(cogs?.margin_percent ?? 0),
		};
	});

	return {
		item: itemResult[0],
		variations,
		allIngredients: ingredientsResult, // Mapped from our destructured array
	};
};

export const actions: Actions = {
	addIngredient: async ({ request }) => {
		const formData = await request.formData();

		const variationId = formData.get("variation_id") as string;
		const ingredientId = formData.get("ingredient_id") as string;
		const amount = formData.get("amount") as string;

		if (!variationId || !ingredientId || !amount) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			await sql`
                INSERT INTO public.recipes (item_variation_id, ingredient_id, amount)
                VALUES (${variationId}, ${ingredientId}, ${amount})
                ON CONFLICT (item_variation_id, ingredient_id)
                DO UPDATE SET amount = EXCLUDED.amount
            `;

			// Keep analytics in sync
			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: "Error saving recipe" });
		}
	},

	removeIngredient: async ({ request }) => {
		const formData = await request.formData();

		const variationId = formData.get("variation_id") as string;
		const ingredientId = formData.get("ingredient_id") as string;

		if (!variationId || !ingredientId) {
			return fail(400, { error: "Missing IDs" });
		}

		try {
			await sql`
                DELETE FROM public.recipes
                WHERE item_variation_id = ${variationId}
                AND ingredient_id = ${ingredientId}
            `;

			await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.item_variation_cogs`;

			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: "Error removing ingredient" });
		}
	},
};
