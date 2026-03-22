import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const todayOrders = await sql`
        SELECT
            o.id,
            o.customer_name,
            o.payment_method,
            o.status,
            o.created_at,
            o.price_total,
            o.shift,
            o.kind,
            COALESCE(
                json_agg(
                    json_build_object(
                        'name', i.name,
                        'qty', oi.quantity
                    )
                ) FILTER (WHERE oi.id IS NOT NULL AND oi.status != 'voided'), '[]'::json
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN items i ON oi.item_id = i.id
        WHERE o.created_at >= CURRENT_DATE
          AND o.created_at < CURRENT_DATE + INTERVAL '1 day'
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

	return { todayOrders };
};

export const actions: Actions = {
	refundOrder: async ({ request, locals }) => {
		// 1. Security check: Only logged-in staff can issue refunds
		if (!locals.user) {
			return fail(401, { error: "Unauthorized. Please log in." });
		}

		// FIX: Extract the ID into a const so TypeScript knows it can never be null inside the transaction callback
		const cashierId = locals.user.id;

		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const originalOrderId = orderIdStr ? Number(orderIdStr) : null;

		if (!originalOrderId) return fail(400, { error: "Missing order ID" });

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 2. Fetch and Validate the Original Order
				const [original] = await q`SELECT * FROM orders WHERE id = ${originalOrderId}`;

				if (!original) throw new Error("Order not found");
				if (original.kind !== "sale") throw new Error("You can only refund a sale ticket.");
				if (original.payment_method === null)
					throw new Error("Cannot refund an unpaid ticket.");
				if (original.status === "cancelled")
					throw new Error("Cannot refund a voided ticket.");

				// 3. Prevent Double Refunds
				const [existingRefund] = await q`
                    SELECT id FROM orders
                    WHERE parent_order_id = ${originalOrderId}
                    LIMIT 1
                `;
				if (existingRefund) {
					throw new Error("This ticket has already been refunded.");
				}

				// 4. Create the Refund Ticket (The Ledger Entry)
				const [refundOrder] = await q`
                    INSERT INTO orders (
                        customer_name, payment_method, shift, price_total, cogs_total,
                        status, user_id, kind, parent_order_id
                    ) VALUES (
                        ${original.customer_name}, ${original.payment_method}, ${original.shift},
                        ${original.price_total}, ${original.cogs_total},
                        'served', ${cashierId}, 'refund', ${original.id}
                    ) RETURNING id
                `;

				// 5. Clone the Line Items to the Refund Ticket
				await q`
                    INSERT INTO order_items (
                        order_id, item_id, price_base, quantity, cogs_base, price_total, cogs_total, status
                    )
                    SELECT
                        ${refundOrder.id}, item_id, price_base, quantity, cogs_base, price_total, cogs_total, 'refunded'
                    FROM order_items
                    WHERE order_id = ${original.id} AND status = 'active'
                `;

				// --- THE KITCHEN & INVENTORY FIX ---

				// 6. Update the Original Items
				await q`
                    UPDATE order_items
                    SET status = 'refunded'
                    WHERE order_id = ${original.id} AND status = 'active'
                `;

				// 7. Halt the Barista (If necessary)
				if (original.status === "preparing") {
					await q`
                        UPDATE orders
                        SET status = 'cancelled'
                        WHERE id = ${original.id}
                    `;
				}
			});

			return { success: true };
		} catch (error) {
			console.error("Refund Error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to process refund.";
			return fail(400, { error: errorMessage });
		}
	},
};
