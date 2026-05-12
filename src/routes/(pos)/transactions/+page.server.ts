import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

type OrderRow = {
	id: number;
	customer_name: string | null;
	payment_method: string | null;
	shift: string;
};

type OrderItemRow = {
	id: number;
	item_variation_id: number;
	quantity: number;
	price_base: number;
	cogs_base: number;
	price_total: number;
	cogs_total: number;
	fulfillment_status: "preparing" | "served" | "cancelled";
};

export const load: PageServerLoad = async () => {
	// 1. Fetch Today's Transactions
	const todayOrders = await sql`
        WITH TodayOrders AS (
            SELECT
                id,
                customer_name,
                payment_method,
                created_at,
                price_total,
                shift,
                kind,
                parent_order_id
            FROM public.orders
            WHERE created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
        ),

        ItemLookup AS (
            SELECT
                iv.id AS variation_id,
                i.name || ' (' || iv.name || ')' AS display_name
            FROM public.item_variations iv
            JOIN public.items i
                ON i.id = iv.item_id
        ),

        OrderItemsAgg AS (
            SELECT
                oi.order_id,

                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'name', COALESCE(il.display_name, 'Custom Item'),
                        'qty', oi.quantity,
                        'price_total', oi.price_total,
                        'ledger_status', oi.ledger_status,
                        'fulfillment_status', oi.fulfillment_status,
                        'original_order_item_id', oi.original_order_item_id
                    )
                    ORDER BY oi.id ASC
                ) AS items

            FROM public.order_items oi
            JOIN TodayOrders t
                ON t.id = oi.order_id
            LEFT JOIN ItemLookup il
                ON il.variation_id = oi.item_variation_id
            GROUP BY oi.order_id
        )

        SELECT
            t.*,
            COALESCE(oa.items, '[]'::json) AS items
        FROM TodayOrders t
        LEFT JOIN OrderItemsAgg oa
            ON oa.order_id = t.id
        ORDER BY t.created_at DESC;
    `;

	return { todayOrders };
};

export const actions: Actions = {
	partialRefund: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: "Unauthorized. Please log in." });
		}
		const profileId = locals.user.id;

		const formData = await request.formData();
		const orderId = Number(formData.get("order_id"));

		const itemIdsToRefundJson = formData.get("item_ids") as string;
		if (!itemIdsToRefundJson) return fail(400, { error: "No items selected." });

		let itemIdsToRefund: number[];
		try {
			itemIdsToRefund = JSON.parse(itemIdsToRefundJson);
		} catch {
			return fail(400, { error: "Invalid item data." });
		}

		if (!Array.isArray(itemIdsToRefund) || itemIdsToRefund.length === 0) {
			return fail(400, { error: "No items selected." });
		}

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 1. Fetch the Original Ticket and LOCK IT
				const [original] = await q<OrderRow[]>`
                    SELECT * FROM public.orders
                    WHERE id = ${orderId}
                    FOR UPDATE
                `;
				if (!original) throw new Error("Original order not found.");

				// 2. Fetch + Validate Ownership + Lock Rows (FOR UPDATE)
				const items = await q<OrderItemRow[]>`
                    SELECT id, item_variation_id, quantity, price_base, cogs_base, price_total, cogs_total, fulfillment_status
                    FROM public.order_items
                    WHERE id = ANY(${itemIdsToRefund}) AND order_id = ${orderId}
                    FOR UPDATE
                `;

				if (items.length === 0) throw new Error("Items not found.");
				if (items.length !== itemIdsToRefund.length) {
					throw new Error(
						"Security Violation: Item mismatch. Some items may not belong to this order."
					);
				}

				// 3. Double-Refund Guard (After locks and validation)
				const existingRefunds = await q`
                    SELECT 1
                    FROM public.order_items
                    WHERE original_order_item_id = ANY(${itemIdsToRefund})
                    LIMIT 1
                `;

				if (existingRefunds.length > 0) {
					throw new Error(
						"Security Violation: One or more of these specific items have already been refunded."
					);
				}

				// Calculate Revenue and Intelligent COGS
				let refundPriceTotal = 0;
				let refundCogsTotal = 0;

				for (const item of items) {
					refundPriceTotal += Number(item.price_total) * -1;

					// THE UPGRADE: Only recoup COGS if the kitchen hasn't made it yet!
					if (item.fulfillment_status === "preparing") {
						refundCogsTotal += Number(item.cogs_total) * -1;
					}
				}

				// 4. Create the negative counter-weight ticket (LEAVE IT OPEN)
				const [refundOrder] = await q`
                    INSERT INTO public.orders (
                        parent_order_id, profile_id, kind,
                        price_total, cogs_total, shift, customer_name
                        -- NOTE: payment_method is intentionally omitted here!
                    )
                    VALUES (
                        ${orderId}, ${profileId}, 'refund',
                        ${refundPriceTotal}, ${refundCogsTotal}, ${original.shift}, ${original.customer_name}
                    )
                    RETURNING id
                `;

				// 5. Clone the items AND their modifiers into the new ticket
				for (const item of items) {
					// Apply the same logic per-item
					const isRecoupable = item.fulfillment_status === "preparing";
					const targetCogsBase = isRecoupable ? Number(item.cogs_base) : 0;
					const targetCogsTotal = isRecoupable ? Number(item.cogs_total) * -1 : 0;

					const [refundOrderItem] = await q`
                        INSERT INTO public.order_items (
                            order_id, item_variation_id, quantity, price_base, cogs_base,
                            price_total, cogs_total, ledger_status, fulfillment_status,
                            original_order_item_id
                        )
                        VALUES (
                            ${refundOrder.id}, ${item.item_variation_id}, ${-item.quantity}, ${item.price_base}, ${targetCogsBase},
                            ${-Number(item.price_total)}, ${targetCogsTotal}, 'refunded'::public.ledger_state, 'cancelled'::public.fulfillment_state,
                            ${item.id}
                        )
                        RETURNING id
                    `;

					// Clone the modifiers to keep reporting perfectly balanced!
					const modifiers = await q`
                        SELECT modifier_id, quantity_per_item, price_base, cogs_base, resolved_ingredient_id
                        FROM public.order_item_modifiers
                        WHERE order_item_id = ${item.id}
                    `;

					for (const mod of modifiers) {
						const modCogsBase = isRecoupable ? Number(mod.cogs_base) : 0;
						await q`
                            INSERT INTO public.order_item_modifiers (
                                order_item_id, modifier_id, quantity_per_item, price_base, cogs_base, resolved_ingredient_id
                            )
                            VALUES (
                                ${refundOrderItem.id}, ${mod.modifier_id}, ${-mod.quantity_per_item}, ${mod.price_base}, ${modCogsBase}, ${mod.resolved_ingredient_id}
                            )
                        `;
					}
				}

				// 6. Seal the Refund Ticket!
				await q`
                    UPDATE public.orders
                    SET payment_method = ${original.payment_method}
                    WHERE id = ${refundOrder.id}
                `;

				// 7. Kitchen Intercept (Tell the kitchen to stop making the refunded items if they haven't served them yet)
				await q`
                    UPDATE public.order_items
                    SET fulfillment_status = 'cancelled'::public.fulfillment_state
                    WHERE id = ANY(${itemIdsToRefund})
                      AND ledger_status = 'active'
                      AND fulfillment_status = 'preparing'
                `;
			});
			return { success: true };
		} catch (error) {
			console.error("Partial Refund DB Error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to process partial refund.";
			return fail(500, { error: errorMessage });
		}
	},
};
