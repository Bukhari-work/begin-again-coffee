import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const activeOrders = await sql`
        WITH TicketStatus AS (
            SELECT
                o.id,
                o.customer_name,
                o.payment_method,
                o.created_at,
                o.price_total,

                -- The Matrix: Derive the ticket status from the physical items
                CASE
                    WHEN COUNT(oi.id) = 0 THEN 'empty'

                    -- If EVERY item was physically aborted, the ticket is dead.
                    WHEN bool_and(oi.fulfillment_status = 'cancelled') THEN 'cancelled'

                    -- THE FIX: If AT LEAST ONE item is still being made, the ticket stays in the queue.
                    WHEN bool_or(oi.fulfillment_status = 'preparing') THEN 'preparing'

                    -- If it's not empty, not 100% cancelled, and nothing is preparing...
                    -- it means a mix of 'served' and 'cancelled' items. The kitchen is done!
                    ELSE 'served'
                END as derived_status,

                -- THE UPGRADE: We check if this ticket has ANY items we expect money for
                bool_or(oi.ledger_status = 'active') as has_active_ledger,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'name', i.name || ' (' || iv.name || ')',
                            'qty', oi.quantity,
                            'fulfillment_status', oi.fulfillment_status,
                            'ledger_status', oi.ledger_status, -- THE UPGRADE: Pass this to the UI
                            'modifiers', (
                                SELECT COALESCE(json_agg(
                                    json_build_object('name', m.name, 'qty', oim.quantity_per_item)
                                ), '[]'::json)
                                FROM order_item_modifiers oim
                                JOIN modifiers m ON m.id = oim.modifier_id
                                WHERE oim.order_item_id = oi.id
                            )
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL AND oi.ledger_status IN ('active', 'voided')), '[]'::json
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN item_variations iv ON oi.item_variation_id = iv.id
            LEFT JOIN items i ON iv.item_id = i.id
            WHERE o.kind = 'sale'
              AND o.created_at::DATE = CURRENT_DATE
            GROUP BY o.id
        )
        SELECT * FROM TicketStatus
        -- THE UPGRADE: Only show tickets if we still need to make them (preparing),
        -- OR if we made them but haven't collected the money yet (served + unpaid).
        -- If it is 'cancelled', it drops off the queue entirely!
        WHERE derived_status = 'preparing'
            OR (derived_status = 'served' AND payment_method IS NULL AND has_active_ledger = true)
        ORDER BY created_at ASC;
    `;

	return { activeOrders };
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
