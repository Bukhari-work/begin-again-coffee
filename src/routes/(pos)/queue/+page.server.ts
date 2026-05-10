import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const activeOrders = await sql`
        WITH TodaySales AS (
            -- 1. Isolate today's sales ONCE
            SELECT
                id,
                customer_name,
                payment_method,
                created_at,
                price_total
            FROM public.orders
            WHERE kind = 'sale'
              AND created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
        ),

        ItemModifiers AS (
            -- 2. Pre-aggregate modifiers ONLY for today's relevant items
            SELECT
                oim.order_item_id,

                json_agg(
                    json_build_object(
                        'name', m.name,
                        'qty', oim.quantity_per_item
                    )
                    ORDER BY m.name ASC
                ) AS mod_json

            FROM public.order_item_modifiers oim

            JOIN public.modifiers m
                ON m.id = oim.modifier_id

            JOIN public.order_items oi
                ON oi.id = oim.order_item_id
               AND oi.ledger_status IN ('active', 'voided')

            JOIN TodaySales ts
                ON ts.id = oi.order_id

            GROUP BY oim.order_item_id
        ),

        TicketStatus AS (
            -- 3. Build queue tickets
            SELECT
                ts.id,
                ts.customer_name,
                ts.payment_method,
                ts.created_at,
                ts.price_total,

                CASE
                    WHEN COUNT(oi.id) = 0 THEN 'empty'

                    WHEN bool_and(
                        oi.fulfillment_status = 'cancelled'
                    ) THEN 'cancelled'

                    WHEN bool_or(
                        oi.fulfillment_status = 'preparing'
                    ) THEN 'preparing'

                    ELSE 'served'
                END AS derived_status,

                bool_or(
                    oi.ledger_status = 'active'
                ) AS has_active_ledger,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'name', i.name || ' (' || iv.name || ')',
                            'qty', oi.quantity,
                            'fulfillment_status', oi.fulfillment_status,
                            'ledger_status', oi.ledger_status,
                            'modifiers', COALESCE(im.mod_json, '[]'::json)
                        )
                        ORDER BY oi.id ASC
                    ) FILTER (
                        WHERE oi.id IS NOT NULL
                    ),
                    '[]'::json
                ) AS items

            FROM TodaySales ts

            LEFT JOIN public.order_items oi
                ON oi.order_id = ts.id
               AND oi.ledger_status IN ('active', 'voided')

            LEFT JOIN public.item_variations iv
                ON iv.id = oi.item_variation_id

            LEFT JOIN public.items i
                ON i.id = iv.item_id

            LEFT JOIN ItemModifiers im
                ON im.order_item_id = oi.id

            GROUP BY
                ts.id,
                ts.customer_name,
                ts.payment_method,
                ts.created_at,
                ts.price_total
        )

        -- 4. Final queue filter
        SELECT *
        FROM TicketStatus
        WHERE derived_status = 'preparing'
           OR (
                derived_status = 'served'
                AND payment_method IS NULL
                AND has_active_ledger = true
           )
        ORDER BY created_at ASC;
    `;

	return {
		activeOrders,
	};
};
export const actions: Actions = {
	// Action 1: The barista finishes making ONE specific drink
	markItemServed: async ({ request }) => {
		const formData = await request.formData();
		const itemIdStr = formData.get("item_id") as string;
		const itemId = itemIdStr ? Number(itemIdStr) : null;

		if (!itemId) return fail(400, { error: "Missing item ID" });

		try {
			await sql`
                  UPDATE order_items
                  SET fulfillment_status = 'served'::public.fulfillment_state
                  WHERE id = ${itemId} AND fulfillment_status = 'preparing'
              `;
			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: "Failed to serve item" });
		}
	},

	// Action 2: The barista aborts ONE specific drink
	cancelItem: async ({ request }) => {
		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const itemIdStr = formData.get("item_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;
		const itemId = itemIdStr ? Number(itemIdStr) : null;

		if (!orderId || !itemId) return fail(400, { error: "Missing required IDs" });

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 1. Matrix Check: Is the parent ticket paid?
				const [order] = await q`SELECT payment_method FROM orders WHERE id = ${orderId}`;
				if (!order) throw new Error("Order not found");

				const isPaid = order.payment_method !== null;

				if (isPaid) {
					// LIABILITY SHIFT: Only cancel fulfillment. Leave ledger active.
					await q`
                          UPDATE order_items
                          SET fulfillment_status = 'cancelled'::public.fulfillment_state
                          WHERE id = ${itemId}
                      `;
				} else {
					// WASTE/TYPO SHIFT: Void the ledger and cancel fulfillment.
					await q`
                          UPDATE order_items
                          SET
                              ledger_status = 'voided'::public.ledger_state,
                              fulfillment_status = 'cancelled'::public.fulfillment_state
                          WHERE id = ${itemId}
                      `;
				}

				// 2. Denormalization Sync
				// This recalculates the parent order. If it's unpaid, the ticket gets cheaper!
				await q`
                UPDATE orders o
                SET
                    price_total = (SELECT COALESCE(SUM(price_total), 0) FROM order_items WHERE order_id = o.id AND ledger_status = 'active'),
                    cogs_total = (SELECT COALESCE(SUM(cogs_total), 0) FROM order_items WHERE order_id = o.id AND fulfillment_status IN ('preparing', 'served'))
                WHERE id = ${orderId}
                `;
			});

			return { success: true };
		} catch (error) {
			console.error("Cancel Item Error:", error);
			return fail(500, { error: "Failed to cancel item" });
		}
	},

	// Action 3: The barista finishes making the order
	markServed: async ({ request }) => {
		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;

		if (!orderId) return fail(400, { error: "Missing order ID" });

		try {
			await sql`
                  UPDATE order_items
                  SET fulfillment_status = 'served'::public.fulfillment_state
                  WHERE order_id = ${orderId}
                    AND fulfillment_status = 'preparing'
              `;

			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: "Failed to update fulfillment status" });
		}
	},

	// Action 4: The barista aborts the order
	cancelTicket: async ({ request }) => {
		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;

		if (!orderId) return fail(400, { error: "Missing order ID" });

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 1. Check if the ticket has already been paid (or comped)
				const [order] = await q`
            SELECT payment_method
            FROM orders
            WHERE id = ${orderId}
            FOR UPDATE
        `;
				if (!order) throw new Error("Order not found");

				const isPaid = order.payment_method !== null;

				if (isPaid) {
					// THE LIABILITY SHIFT (Sale | Active | Cancelled)
					// The customer paid, but we are aborting the physical drink.
					// We specifically DO NOT touch the ledger_status. It must stay 'active'.
					await q`
                        UPDATE order_items
                        SET fulfillment_status = CASE
                            WHEN fulfillment_status = 'preparing' THEN 'cancelled'::public.fulfillment_state
                            ELSE fulfillment_status
                        END
                        WHERE order_id = ${orderId}
                    `;
				} else {
					// THE WASTE/TYPO SHIFT (Sale | Voided | Cancelled/Served)
					// The ticket is unpaid. We can safely void the financial expectation.
					await q`
                        UPDATE order_items
                        SET
                            ledger_status = 'voided'::public.ledger_state,
                            fulfillment_status = CASE
                                WHEN fulfillment_status = 'preparing' THEN 'cancelled'::public.fulfillment_state
                                ELSE fulfillment_status
                            END
                        WHERE order_id = ${orderId}
                    `;
				}

				// 2. Denormalization Sync (The Split-Matrix Method)
				await q`
                    UPDATE orders o
                    SET
                        price_total = (SELECT COALESCE(SUM(price_total), 0) FROM order_items WHERE order_id = o.id AND ledger_status = 'active'),
                        cogs_total = (SELECT COALESCE(SUM(cogs_total), 0) FROM order_items WHERE order_id = o.id AND fulfillment_status IN ('preparing', 'served'))
                    WHERE id = ${orderId}
                `;
			});

			return { success: true };
		} catch (error) {
			console.error("Cancel Error:", error);
			return fail(500, { error: "Failed to cancel order" });
		}
	},

	// Action 5: The customer comes to the counter to pay their open tab
	payTicket: async ({ request }) => {
		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;
		const paymentMethod = formData.get("payment_method") as string;

		if (!orderId || !paymentMethod) return fail(400, { error: "Missing required fields" });

		try {
			const [updatedOrder] = await sql`
                UPDATE orders
                SET payment_method = ${paymentMethod}
                WHERE id = ${orderId}
                RETURNING price_total
            `;

			if (paymentMethod === "comped" && Number(updatedOrder.price_total) > 0) {
				// Revert the transaction by throwing an error
				await sql`UPDATE orders SET payment_method = NULL WHERE id = ${orderId}`;
				return fail(400, { error: "Cannot comp an order with a positive balance." });
			}

			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: "Failed to process payment" });
		}
	},
};
