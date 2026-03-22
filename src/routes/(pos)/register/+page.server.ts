import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	// 1. Fetch Menu Items
	const items = await sql`
		SELECT i.id, i.name, i.price, i.category_id, i.description, c.name as category_name, image_url
		FROM items i
		LEFT JOIN categories c ON i.category_id = c.id
		WHERE i.is_available = true
		ORDER BY c.id ASC, i.name ASC
	`;

	// 2. Fetch Modifier Groups & Rules
	const modifierGroups = await sql`
		SELECT mg.id, mg.name, mg.min_selections, mg.max_selections, mgr.item_id, mgr.category_id
		FROM modifier_groups mg
		JOIN modifier_group_rules mgr ON mg.id = mgr.group_id
	`;

	// 3. Fetch All Active Modifiers
	const modifiers = await sql`
		SELECT id, group_id, name, price_adjustment, ingredient_id, behavior, quantity
		FROM modifiers
		WHERE is_available = true
		ORDER BY price_adjustment ASC
	`;

	// 4. Fetch Order Data if Editing
	const editId = url.searchParams.get("edit");
	let editOrderData = null;

	if (editId) {
		const [order] = await sql`
			SELECT
				o.id, o.customer_name, o.payment_method, o.shift,
				COALESCE(
					json_agg(
						json_build_object(
							'cart_id', oi.id::text,
							'id', i.id,
							'name', i.name,
							'category', 'Loaded Item',
							'base_price', oi.price_base,
							'price', oi.price_total / oi.quantity,
							'qty', oi.quantity,
							'modifiers', (
								SELECT COALESCE(json_agg(
									json_build_object('id', m.id, 'name', m.name, 'qty', oim.quantity, 'price', oim.price_base)
								), '[]'::json)
								FROM order_item_modifiers oim
								JOIN modifiers m ON m.id = oim.modifier_id
								WHERE oim.order_item_id = oi.id
							)
						)
					) FILTER (WHERE oi.id IS NOT NULL AND oi.status = 'active'), '[]'::json
				) as cart
			FROM orders o
			LEFT JOIN order_items oi ON o.id = oi.order_id
			LEFT JOIN items i ON oi.item_id = i.id
			WHERE o.id = ${editId}
			GROUP BY o.id
		`;

		if (order) {
			editOrderData = order;
		}
	}

	return { items, modifierGroups, modifiers, editOrderData };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// --- 1. AUTHENTICATION ---
		if (!locals.user) {
			return fail(401, { error: "Unauthorized. Please log in again." });
		}
		const cashierId = locals.user.id;

		// --- 2. PARSE FORM DATA ---
		const formData = await request.formData();
		const customerName = formData.get("customer_name") as string;
		const paymentType = formData.get("payment_method") as string;
		const shift = formData.get("shift") as string;
		const cartJson = formData.get("cart") as string;
		const editOrderIdStr = formData.get("edit_order_id") as string;
		const editOrderId = editOrderIdStr ? Number(editOrderIdStr) : null;

		if (!paymentType || !cartJson || !shift) {
			return fail(400, { error: "Missing required fields" });
		}

		const actualPaymentMethod = paymentType === "unpaid" ? null : paymentType;

		let cart: Array<{
			id: number;
			qty: number;
			modifiers?: Array<{ id: number; qty: number }>;
		}>;
		try {
			cart = JSON.parse(cartJson);
		} catch {
			return fail(400, { error: "Invalid cart format" });
		}

		if (cart.length === 0) return fail(400, { error: "Cart is empty" });

		const itemIds = [...new Set(cart.map((i) => i.id))];
		const allModifierIds = [
			...new Set(cart.flatMap((i) => i.modifiers?.map((m) => m.id) || [])),
		];

		let targetOrderId = 0;

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// --- 3. PRE-FETCH AUTHORITATIVE PRICING & COGS ---
				const basePrices = await q`SELECT id, price FROM items WHERE id = ANY(${itemIds})`;
				const basePriceMap = new Map(basePrices.map((r) => [r.id, Number(r.price)]));

				const baseCosts = await q`
					SELECT r.item_variation_id as item_id, COALESCE(SUM(r.amount * vic.cost_per_unit), 0) as cost
					FROM recipes r
					LEFT JOIN view_ingredient_costs vic ON r.ingredient_id = vic.ingredient_id
					WHERE r.item_variation_id = ANY(${itemIds})
					GROUP BY r.item_variation_id
				`;
				const baseCostMap = new Map(baseCosts.map((r) => [r.item_id, Number(r.cost)]));

				type ModifierRow = {
					id: number;
					ingredient_id: number | null;
					behavior: string;
					quantity: number;
					price_adjustment: number;
				};
				const modifierDataMap = new Map<number, ModifierRow>();
				const ingredientCostMap = new Map<number, number>();

				if (allModifierIds.length > 0) {
					const mods =
						await q`SELECT id, ingredient_id, behavior, quantity, price_adjustment FROM modifiers WHERE id = ANY(${allModifierIds})`;
					mods.forEach((m) => modifierDataMap.set(m.id as number, m as ModifierRow));

					const ingredientIds = mods.map((m) => m.ingredient_id).filter(Boolean);
					if (ingredientIds.length > 0) {
						const costs =
							await q`SELECT ingredient_id, cost_per_unit FROM view_ingredient_costs WHERE ingredient_id = ANY(${ingredientIds})`;
						costs.forEach((c) =>
							ingredientCostMap.set(c.ingredient_id, Number(c.cost_per_unit))
						);
					}
				}

				// --- 4. ORDER CREATION OR UPDATE ---
				if (editOrderId) {
					// 4a. Security Check for Edits
					const [existingOrder] =
						await q`SELECT payment_method, status FROM orders WHERE id = ${editOrderId}`;
					if (!existingOrder) throw new Error("Order not found.");
					if (existingOrder.payment_method !== null)
						throw new Error("Security Violation: Cannot modify a paid order.");
					if (existingOrder.status === "cancelled")
						throw new Error("Cannot modify a cancelled order.");

					// 4b. Update Main Ticket
					await q`
						UPDATE orders
						SET customer_name = ${customerName}, payment_method = ${actualPaymentMethod}, shift = ${shift}
						WHERE id = ${editOrderId}
					`;
					targetOrderId = editOrderId;

					// 4c. The Soft Wipe (Audit Trail)
					await q`
						UPDATE order_items
						SET status = 'voided'
						WHERE order_id = ${targetOrderId} AND status = 'active'
					`;
				} else {
					// 4d. Create New Ticket
					const [newOrder] = await q`
						INSERT INTO orders (customer_name, payment_method, shift, user_id)
						VALUES (${customerName}, ${actualPaymentMethod}, ${shift}, ${cashierId})
						RETURNING id
					`;
					targetOrderId = newOrder.id;
				}

				// --- 5. PROCESS CART ITEMS ---
				let grandTotalPrice = 0;
				let grandTotalCogs = 0;

				for (const item of cart) {
					const unitBaseCogs = baseCostMap.get(item.id) || 0;
					const unitBasePrice = basePriceMap.get(item.id) || 0;
					let lineItemModifiersTotalCogs = 0;
					let lineItemModifiersTotalPrice = 0;

					// Insert item (Defaults to status = 'active' automatically per schema)
					const [newOrderItem] = await q`
						INSERT INTO order_items (order_id, item_id, price_base, cogs_base, quantity, price_total, cogs_total)
						VALUES (${targetOrderId}, ${item.id}, ${unitBasePrice}, ${unitBaseCogs}, ${item.qty}, 0, 0)
						RETURNING id
					`;

					// Process Modifiers
					if (item.modifiers && item.modifiers.length > 0) {
						const beanModifier = item.modifiers.find((m) => {
							const details = modifierDataMap.get(m.id);
							return (
								details && details.ingredient_id && details.behavior === "STATIC"
							);
						});
						const selectedBeanId = beanModifier
							? (modifierDataMap.get(beanModifier.id)?.ingredient_id ?? null)
							: null;

						for (const mod of item.modifiers) {
							const modDef = modifierDataMap.get(mod.id);
							if (!modDef) continue;

							let unitModCogs = 0;
							if (modDef.behavior === "DYNAMIC_BASE" && selectedBeanId) {
								const beanCost = ingredientCostMap.get(selectedBeanId) || 0;
								unitModCogs = Number(modDef.quantity) * beanCost;
							} else if (
								modDef.behavior === "STATIC" &&
								modDef.ingredient_id !== null
							) {
								const ingCost = ingredientCostMap.get(modDef.ingredient_id) || 0;
								unitModCogs = Number(modDef.quantity) * ingCost;
							}

							const modTotalCogs = unitModCogs * mod.qty;
							const modTotalPrice = Number(modDef.price_adjustment) * mod.qty;

							lineItemModifiersTotalCogs += modTotalCogs;
							lineItemModifiersTotalPrice += modTotalPrice;

							await q`
								INSERT INTO order_item_modifiers (order_item_id, modifier_id, quantity, price_base, cogs_base)
								VALUES (${newOrderItem.id}, ${mod.id}, ${mod.qty}, ${modDef.price_adjustment}, ${unitModCogs})
							`;
						}
					}

					// Denormalize Line Item Totals
					const finalLineCogs = unitBaseCogs * item.qty + lineItemModifiersTotalCogs;
					const finalLinePrice = unitBasePrice * item.qty + lineItemModifiersTotalPrice;

					grandTotalCogs += finalLineCogs;
					grandTotalPrice += finalLinePrice;

					await q`
						UPDATE order_items
						SET price_total = ${finalLinePrice}, cogs_total = ${finalLineCogs}
						WHERE id = ${newOrderItem.id}
					`;
				}

				// --- 6. UPDATE TICKET GRAND TOTALS ---
				await q`
					UPDATE orders
					SET price_total = ${grandTotalPrice}, cogs_total = ${grandTotalCogs}
					WHERE id = ${targetOrderId}
				`;
			});

			return { success: true, orderId: targetOrderId };
		} catch (error) {
			console.error("POS Transaction Error:", error);
			// Pass the specific error message to the UI if it's our custom security throw
			return fail(400, { error: "Failed to process order." });
		}
	},
};
