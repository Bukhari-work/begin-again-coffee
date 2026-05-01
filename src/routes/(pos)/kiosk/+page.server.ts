import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

// ==========================================
// DOMAIN TYPES
// ==========================================

type ModifierRow = {
	id: number;
	group_id: number;
	ingredient_id: number | null;
	behavior: "STATIC" | "DEPENDENT";
	quantity: number;
	price_adjustment: number;
	dependency_source: number | null;
};

type CartModifierInput = {
	id: number;
	qty: number;
};

type PricingInput = {
	variationId: number;
	qty: number;
	isFreebie?: boolean;
	modifiers?: CartModifierInput[];
};

type PricingMaps = {
	basePriceMap: Map<number, number>;
	baseCostMap: Map<number, number>;
	modifierDataMap: Map<number, ModifierRow>;
	ingredientCostMap: Map<number, number>;
};

// Added for strict typing of the incoming form data
type ParsedCartItem = {
	id: number;
	db_item_id?: number;
	qty: number;
	is_freebie?: boolean;
	modifiers?: CartModifierInput[];
};

// 🛡️ Added for strict typing of the loaded edit order
type EditOrderRow = {
	id: number;
	customer_name: string | null;
	payment_method: string | null;
	shift: string;
	cart: Array<{ fulfillment_status?: string }>;
};

// ==========================================
// CORE HELPER — COGS & INGREDIENT RESOLUTION
// ==========================================

function resolveModifierDetails(
	def: ModifierRow,
	selectedByGroup: Map<number, ModifierRow>,
	ingredientCostMap: Map<number, number>
): { cogs: number; resolvedIngredientId: number | null } {
	if (def.behavior === "STATIC") {
		if (def.ingredient_id !== null) {
			const cost = ingredientCostMap.get(def.ingredient_id) || 0;
			return {
				cogs: cost * def.quantity,
				resolvedIngredientId: def.ingredient_id,
			};
		}
		return { cogs: 0, resolvedIngredientId: null };
	}

	if (def.behavior === "DEPENDENT") {
		if (!def.dependency_source) return { cogs: 0, resolvedIngredientId: null };

		const sourceModifier = selectedByGroup.get(def.dependency_source);

		if (sourceModifier?.ingredient_id) {
			const cost = ingredientCostMap.get(sourceModifier.ingredient_id) || 0;
			return {
				cogs: cost * def.quantity,
				resolvedIngredientId: sourceModifier.ingredient_id,
			};
		}
	}

	return { cogs: 0, resolvedIngredientId: null };
}

// ==========================================
// PRICING ENGINE
// ==========================================

function calculateItemPricing(item: PricingInput, maps: PricingMaps) {
	const { basePriceMap, baseCostMap, modifierDataMap, ingredientCostMap } = maps;

	const unitBasePrice = item.isFreebie ? 0 : basePriceMap.get(item.variationId) || 0;
	const unitBaseCogs = baseCostMap.get(item.variationId) || 0;

	let unitModifiersPrice = 0;
	let unitModifiersCogs = 0;

	// Build selected modifiers by group
	const selectedByGroup = new Map<number, ModifierRow>();

	if (item.modifiers) {
		for (const m of item.modifiers) {
			const def = modifierDataMap.get(m.id);
			if (!def) continue;

			selectedByGroup.set(def.group_id, def);
		}
	}

	// Main loop
	if (item.modifiers) {
		for (const mod of item.modifiers) {
			const def = modifierDataMap.get(mod.id);
			if (!def) continue;

			const { cogs: modCogs } = resolveModifierDetails(
				def,
				selectedByGroup,
				ingredientCostMap
			);

			unitModifiersCogs += modCogs * mod.qty;
			unitModifiersPrice += item.isFreebie ? 0 : def.price_adjustment * mod.qty;
		}
	}

	const finalUnitPrice = unitBasePrice + unitModifiersPrice;
	const finalUnitCogs = unitBaseCogs + unitModifiersCogs;

	return {
		unit_price: finalUnitPrice,
		unit_cogs: finalUnitCogs,
		line_price: finalUnitPrice * item.qty,
		line_cogs: finalUnitCogs * item.qty,
	};
}

// ==========================================
// LOAD
// ==========================================

export const load: PageServerLoad = async ({ url }) => {
	const editIdRaw = url.searchParams.get("edit");
	const editId = editIdRaw ? Number(editIdRaw) : null;

	const itemsPromise = sql`
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
                    ) ORDER BY iv.id ASC
                ) FILTER (WHERE iv.id IS NOT NULL), '[]'::json
            ) AS variations
        FROM public.items i
        LEFT JOIN public.item_categories c ON i.category_id = c.id
        LEFT JOIN public.item_variations iv ON i.id = iv.item_id AND iv.is_available = true
        WHERE i.is_available = true
        GROUP BY i.id, i.name, i.description, i.image_url, c.id, c.name
        ORDER BY c.id ASC, i.name ASC
    `;

	const modifierGroupsPromise = sql`
        SELECT DISTINCT
            mg.id,
            mg.name,
            mg.min_selections,
            mg.max_selections,
            mgr.item_id,
            mgr.category_id
        FROM public.modifier_groups mg
        JOIN public.modifier_group_rules mgr ON mg.id = mgr.group_id
        ORDER BY mg.name ASC
    `;

	const modifiersPromise = sql`
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
        ORDER BY m.group_id ASC, m.price_adjustment ASC, m.name ASC
    `;

	const editOrderPromise = editId
		? sql`
            SELECT
                o.id,
                o.customer_name,
                o.payment_method,
                o.shift,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'cart_item_id', oi.id::text,
                            'db_item_id', oi.id,
                            'id', iv.id,
                            'parent_item_id', i.id,
                            'name', i.name || ' (' || iv.name || ')',
                            'category', 'Loaded Item',
                            'base_price', oi.price_base,
                            'price', oi.price_total / NULLIF(oi.quantity, 0),
                            'qty', oi.quantity,
                            'is_freebie', (oi.ledger_status = 'voided'),
                            'ledger_status', oi.ledger_status,
                            'fulfillment_status', oi.fulfillment_status,
                            'modifiers', (
                                SELECT COALESCE(
                                    json_agg(
                                        json_build_object(
                                            'id', m.id,
                                            'name', m.name,
                                            'qty', oim.quantity,
                                            'price', oim.price_base
                                        )
                                    ),
                                    '[]'::json
                                )
                                FROM public.order_item_modifiers oim
                                JOIN public.modifiers m ON m.id = oim.modifier_id
                                WHERE oim.order_item_id = oi.id
                            )
                        )
                    ) FILTER (
                        WHERE oi.id IS NOT NULL
                          AND oi.ledger_status IN ('active', 'voided')
                          AND oi.fulfillment_status != 'cancelled'
                    ),
                    '[]'::json
                ) AS cart
            FROM public.orders o
            LEFT JOIN public.order_items oi ON o.id = oi.order_id
            LEFT JOIN public.item_variations iv ON oi.item_variation_id = iv.id
            LEFT JOIN public.items i ON iv.item_id = i.id
            WHERE o.id = ${editId}
            GROUP BY o.id
        `
		: Promise.resolve([]);

	const [items, modifierGroups, modifiers, editOrderRows] = await Promise.all([
		itemsPromise,
		modifierGroupsPromise,
		modifiersPromise,
		editOrderPromise,
	]);

	let editOrderData = null;

	if (editId) {
		const [order] = editOrderRows as EditOrderRow[];

		if (order) {
			const hasServedItems = order.cart.some((item) => item.fulfillment_status === "served");

			if (!hasServedItems) {
				editOrderData = order;
			}
		}
	}

	return { items, modifierGroups, modifiers, editOrderData };
};

// ==========================================
// ACTIONS
// ==========================================

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: "Unauthorized." });

		const profileId = locals.user.id;
		const formData = await request.formData();

		const customerName = (formData.get("customer_name") as string) ?? null;
		const paymentType = formData.get("payment_method") as string;
		const shift = formData.get("shift") as string;
		const cartJson = formData.get("cart") as string;
		const editOrderIdStr = formData.get("edit_order_id") as string;
		const editOrderId = editOrderIdStr ? Number(editOrderIdStr) : null;

		if (!paymentType || !cartJson || !shift) {
			return fail(400, { error: "Missing required fields" });
		}

		const actualPaymentMethod = paymentType === "unpaid" ? null : paymentType;

		let cart: ParsedCartItem[];
		try {
			cart = JSON.parse(cartJson);
		} catch {
			return fail(400, { error: "Invalid cart format" });
		}

		if (!Array.isArray(cart) || cart.length === 0) {
			return fail(400, { error: "Cart is empty" });
		}

		const variationIds = [...new Set(cart.map((i) => i.id))];
		const allModifierIds = [
			...new Set(cart.flatMap((i) => i.modifiers?.map((m) => m.id) || [])),
		];

		let targetOrderId = 0;

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// Fetch base data
				const basePrices =
					await q`SELECT id, price FROM public.item_variations WHERE id = ANY(${variationIds})`;
				const basePriceMap = new Map(
					basePrices.map((r) => [Number(r.id), Number(r.price)])
				);

				const baseCosts = await q`
                    SELECT item_variation_id, COALESCE(SUM(amount * vic.cost_per_unit), 0) AS cost
                    FROM public.recipes r
                    LEFT JOIN public.view_ingredient_costs vic ON r.ingredient_id = vic.ingredient_id
                    WHERE item_variation_id = ANY(${variationIds})
                    GROUP BY item_variation_id
                `;
				const baseCostMap = new Map(
					baseCosts.map((r) => [Number(r.item_variation_id), Number(r.cost)])
				);

				const modifierDataMap = new Map<number, ModifierRow>();
				const ingredientCostMap = new Map<number, number>();

				if (allModifierIds.length > 0) {
					const mods = await q`
                        SELECT id, group_id, ingredient_id, behavior, quantity, price_adjustment, dependency_source
                        FROM public.modifiers
                        WHERE id = ANY(${allModifierIds})
                    `;

					mods.forEach((m) => {
						modifierDataMap.set(Number(m.id), {
							id: Number(m.id),
							group_id: Number(m.group_id),
							ingredient_id:
								m.ingredient_id === null ? null : Number(m.ingredient_id),
							behavior: m.behavior as "STATIC" | "DEPENDENT",
							quantity: Number(m.quantity),
							price_adjustment: Number(m.price_adjustment),
							dependency_source:
								m.dependency_source === null ? null : Number(m.dependency_source),
						});
					});

					const ingredientIds = mods
						.map((m) => m.ingredient_id)
						.filter((id): id is number => id !== null);

					if (ingredientIds.length > 0) {
						const costs = await q`
                            SELECT ingredient_id, cost_per_unit
                            FROM public.view_ingredient_costs
                            WHERE ingredient_id = ANY(${ingredientIds})
                        `;
						costs.forEach((c) => {
							ingredientCostMap.set(Number(c.ingredient_id), Number(c.cost_per_unit));
						});
					}
				}

				// Order create/update
				if (editOrderId) {
					const [existingOrder] =
						await q`SELECT payment_method FROM public.orders WHERE id = ${editOrderId}`;
					if (!existingOrder) throw new Error("Order not found.");
					if (existingOrder.payment_method !== null) {
						throw new Error(
							"Security Violation: Cannot modify a paid order. Please issue a refund instead."
						);
					}

					const [servedItem] =
						await q`SELECT id FROM public.order_items WHERE order_id = ${editOrderId} AND fulfillment_status = 'served' LIMIT 1`;
					if (servedItem) {
						throw new Error(
							"Kitchen Lock: Items already served. Create a new order to add items."
						);
					}

					await q`
                        UPDATE public.orders
                        SET customer_name = ${customerName}, payment_method = ${actualPaymentMethod}, shift = ${shift}
                        WHERE id = ${editOrderId}
                    `;
					targetOrderId = editOrderId;

					const existingDbItems = await q`
                        SELECT id FROM public.order_items
                        WHERE order_id = ${targetOrderId} AND ledger_status IN ('active', 'voided') AND fulfillment_status != 'cancelled'
                    `;
					const incomingDbIds = cart
						.map((i) => i.db_item_id)
						.filter((id): id is number => typeof id === "number");

					const idsToVoid = existingDbItems
						.map((row) => Number(row.id))
						.filter((id) => !incomingDbIds.includes(id));

					if (idsToVoid.length > 0) {
						await q`UPDATE public.order_items SET ledger_status = 'voided', fulfillment_status = 'cancelled' WHERE id = ANY(${idsToVoid})`;
					}
				} else {
					const [newOrder] = await q`
                        INSERT INTO public.orders (customer_name, payment_method, shift, profile_id)
                        VALUES (${customerName}, ${actualPaymentMethod}, ${shift}, ${profileId})
                        RETURNING id
                    `;
					targetOrderId = Number(newOrder.id);
				}

				// Process cart
				for (const item of cart) {
					const pricing = calculateItemPricing(
						{
							variationId: item.id,
							qty: item.qty,
							isFreebie: item.is_freebie,
							modifiers: item.modifiers || [],
						},
						{
							basePriceMap,
							baseCostMap,
							modifierDataMap,
							ingredientCostMap,
						}
					);

					const targetLedgerStatus = item.is_freebie ? "voided" : "active";
					let targetOrderItemId: number;

					if (item.db_item_id) {
						await q`
                            UPDATE public.order_items
                            SET
                                quantity = ${item.qty},
                                price_base = ${pricing.unit_price},
                                cogs_base = ${pricing.unit_cogs},
                                price_total = ${pricing.line_price},
                                cogs_total = ${pricing.line_cogs},
                                ledger_status = ${targetLedgerStatus}::public.ledger_state
                            WHERE id = ${item.db_item_id}
                        `;
						targetOrderItemId = item.db_item_id;
						await q`DELETE FROM public.order_item_modifiers WHERE order_item_id = ${targetOrderItemId}`;
					} else {
						const [orderItem] = await q`
                            INSERT INTO public.order_items (
                                order_id, item_variation_id,
                                price_base, cogs_base,
                                quantity, price_total, cogs_total,
                                ledger_status
                            )
                            VALUES (
                                ${targetOrderId}, ${item.id},
                                ${pricing.unit_price}, ${pricing.unit_cogs},
                                ${item.qty}, ${pricing.line_price}, ${pricing.line_cogs},
                                ${targetLedgerStatus}::public.ledger_state
                            )
                            RETURNING id
                        `;
						targetOrderItemId = Number(orderItem.id);
					}

					const selectedByGroup = new Map<number, ModifierRow>();
					item.modifiers?.forEach((m) => {
						const def = modifierDataMap.get(m.id);
						if (def) selectedByGroup.set(def.group_id, def);
					});

					for (const mod of item.modifiers || []) {
						const def = modifierDataMap.get(mod.id);
						if (!def) continue;

						const { cogs: modCogs, resolvedIngredientId } = resolveModifierDetails(
							def,
							selectedByGroup,
							ingredientCostMap
						);
						const modPrice = item.is_freebie ? 0 : def.price_adjustment;

						await q`
                   INSERT INTO public.order_item_modifiers
                   (order_item_id, modifier_id, quantity, price_base, cogs_base, resolved_ingredient_id)
                   VALUES (${targetOrderItemId}, ${mod.id}, ${mod.qty}, ${modPrice}, ${modCogs}, ${resolvedIngredientId})
                  `;
					}
				}

				const [finalOrder] = await q`
                    UPDATE public.orders o
                    SET
                        price_total = (
                            SELECT COALESCE(SUM(price_total), 0)
                            FROM public.order_items
                            WHERE order_id = o.id AND ledger_status = 'active'
                        ),
                        cogs_total = (
                            SELECT COALESCE(SUM(cogs_total), 0)
                            FROM public.order_items
                            WHERE order_id = o.id AND fulfillment_status IN ('preparing', 'served')
                        )
                    WHERE id = ${targetOrderId}
                    RETURNING price_total
                `;

				if (actualPaymentMethod === "comped" && Number(finalOrder.price_total) > 0) {
					throw new Error(
						"Security Violation: Cannot assign 'comped' payment method to an order with a positive balance."
					);
				}
			});

			return { success: true, orderId: targetOrderId };
		} catch (err) {
			console.error("POS Transaction Error:", err);
			const errorMessage = err instanceof Error ? err.message : "Transaction failed";
			return fail(400, { error: errorMessage });
		}
	},
};
