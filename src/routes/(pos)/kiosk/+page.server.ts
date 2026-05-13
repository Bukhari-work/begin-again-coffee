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

	// No edit mode
	if (!editId) {
		return {
			editOrderData: null,
		};
	}

	const [order] = await sql`
        WITH TargetOrder AS (
            -- 1. Isolate the target ticket immediately
            SELECT
                id,
                customer_name,
                payment_method,
                shift
            FROM public.orders
            WHERE id = ${editId}
        ),

        TargetItems AS (
            -- 2. Isolate only relevant items
            SELECT
                id,
                order_id,
                item_variation_id,
                quantity,
                price_base,
                ledger_status,
                fulfillment_status
            FROM public.order_items
            WHERE order_id = ${editId}
              AND ledger_status IN ('active', 'voided')
              AND fulfillment_status != 'cancelled'
        ),

        ItemModifiers AS (
            -- 3. Aggregate modifiers only for isolated items
            SELECT
                oim.order_item_id,
                json_agg(
                    json_build_object(
                        'id', m.id,
                        'name', m.name,
                        'qty', oim.quantity_per_item,
                        'price', oim.price_base
                    )
                    ORDER BY m.name ASC
                ) AS modifiers
            FROM public.order_item_modifiers oim
            JOIN public.modifiers m
                ON m.id = oim.modifier_id
            JOIN TargetItems ti
                ON ti.id = oim.order_item_id
            GROUP BY oim.order_item_id
        )

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
                        'price', oi.price_base,
                        'qty', oi.quantity,
                        'is_freebie', (oi.ledger_status = 'voided'),
                        'ledger_status', oi.ledger_status,
                        'fulfillment_status', oi.fulfillment_status,
                        'modifiers', COALESCE(im.modifiers, '[]'::json)
                    )
                    ORDER BY oi.id ASC
                ) FILTER (
                    WHERE oi.id IS NOT NULL
                ),
                '[]'::json
            ) AS cart

        FROM TargetOrder o
        LEFT JOIN TargetItems oi
            ON oi.order_id = o.id
        LEFT JOIN public.item_variations iv
            ON iv.id = oi.item_variation_id
        LEFT JOIN public.items i
            ON i.id = iv.item_id
        LEFT JOIN ItemModifiers im
            ON im.order_item_id = oi.id
        GROUP BY
            o.id,
            o.customer_name,
            o.payment_method,
            o.shift;
    `;

	if (!order) {
		return {
			editOrderData: null,
		};
	}

	// 1. Financial Lock:
	// If the customer has paid, the ticket is immutable.
	// Modifications must be handled via Refunds on the Transaction page.
	if (order.payment_method !== null) {
		return { editOrderData: null };
	}

	// 2. Kitchen Lock:
	// Once ANY item is served, the ticket becomes immutable.
	const hasServedItems = order.cart.some(
		(item: { fulfillment_status?: string }) => item.fulfillment_status === "served"
	);

	if (hasServedItems) {
		return {
			editOrderData: null,
		};
	}

	return {
		editOrderData: order,
	};
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
                    SELECT item_variation_id, COALESCE(SUM(r.amount * vic.cost_per_unit), 0) AS cost
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
                        SET customer_name = ${customerName}, shift = ${shift}
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
                        INSERT INTO public.orders (customer_name, shift, profile_id)
                        VALUES (${customerName}, ${shift}, ${profileId})
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
                   (order_item_id, modifier_id, quantity_per_item, price_base, cogs_base, resolved_ingredient_id)
                   VALUES (${targetOrderItemId}, ${mod.id}, ${mod.qty}, ${modPrice}, ${modCogs}, ${resolvedIngredientId})
                  `;
					}
				}

				const [finalOrder] = await q`
                    UPDATE public.orders o
                    SET
                        payment_method = ${actualPaymentMethod},
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
