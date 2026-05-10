import sql from "$lib/server/db";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, "/login");
	}

	// ==========================================
	// ITEMS
	// ==========================================

	const items = await sql`
        SELECT
            i.id,
            i.name,
            i.category_id,
            i.description,
            c.name AS category_name,
            i.image_url,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', iv.id,
                        'name', iv.name,
                        'price', iv.price
                    )
                    ORDER BY iv.id ASC
                ) FILTER (
                    WHERE iv.id IS NOT NULL
                ),
                '[]'::json
            ) AS variations

        FROM public.items i

        LEFT JOIN public.item_categories c
            ON c.id = i.category_id

        LEFT JOIN public.item_variations iv
            ON iv.item_id = i.id
           AND iv.is_available = true

        WHERE i.is_available = true

        GROUP BY
            i.id,
            i.name,
            i.category_id,
            i.description,
            i.image_url,
            c.name

        ORDER BY
            c.name ASC,
            i.name ASC;
    `;

	// ==========================================
	// MODIFIER GROUPS
	// ==========================================

	const modifierGroups = await sql`
        SELECT DISTINCT
            mg.id,
            mg.name,
            mg.min_selections,
            mg.max_selections,
            mgr.item_id,
            mgr.category_id

        FROM public.modifier_groups mg

        JOIN public.modifier_group_rules mgr
            ON mgr.group_id = mg.id

        ORDER BY mg.name ASC;
    `;

	// ==========================================
	// MODIFIERS
	// ==========================================

	const modifiers = await sql`
        SELECT
            m.id,
            m.group_id,
            m.name,
            m.price_adjustment,
            m.ingredient_id,
            m.behavior,
            m.dependency_source,
            m.quantity

        FROM public.modifiers m

        WHERE m.is_available = true

        ORDER BY
            m.group_id ASC,
            m.price_adjustment ASC,
            m.name ASC;
    `;

	return {
		user: locals.user,

		// Shared POS catalog data
		items,
		modifierGroups,
		modifiers,
	};
};
