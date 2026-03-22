import sql from "$lib/server/db";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch all active tickets.
	const activeOrders = await sql`
        SELECT
            o.id,
            o.customer_name,
            o.payment_method,
            o.status,
            o.created_at,
            o.price_total,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'name', i.name,
                        'qty', oi.quantity,
                        'modifiers', (
                            SELECT COALESCE(json_agg(
                                json_build_object('name', m.name, 'qty', oim.quantity)
                            ), '[]'::json)
                            FROM order_item_modifiers oim
                            JOIN modifiers m ON m.id = oim.modifier_id
                            WHERE oim.order_item_id = oi.id
                        )
                    )
                ) FILTER (WHERE oi.id IS NOT NULL AND oi.status = 'active'), '[]'::json
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN items i ON oi.item_id = i.id
        WHERE (o.status = 'preparing' OR o.payment_method IS NULL)
          AND o.status != 'cancelled'
        GROUP BY o.id
        ORDER BY o.created_at ASC
    `;

	return { activeOrders };
};

export const actions: Actions = {
	// Action 1: The barista finishes making the drinks
	markServed: async ({ request }) => {
		const formData = await request.formData();
		// FIX: Cast to string, then parse to a Number
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;

		if (!orderId) return fail(400, { error: "Missing order ID" });

		try {
			await sql`UPDATE orders SET status = 'served' WHERE id = ${orderId}`;
			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: "Failed to update status" });
		}
	},

	// Action 2: The customer comes to the counter to pay their open tab
	payTicket: async ({ request }) => {
		const formData = await request.formData();
		// FIX: Cast to string and Number
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;
		// FIX: Cast payment method strictly to a string
		const paymentMethod = formData.get("payment_method") as string;

		if (!orderId || !paymentMethod) return fail(400, { error: "Missing required fields" });

		try {
			await sql`
                UPDATE orders
                SET payment_method = ${paymentMethod}
                WHERE id = ${orderId}
            `;
			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: "Failed to process payment" });
		}
	},

	// Action 3: The Smart Cancel (Waste vs. Void)
	cancelTicket: async ({ request }) => {
		const formData = await request.formData();
		const orderIdStr = formData.get("order_id") as string;
		const orderId = orderIdStr ? Number(orderIdStr) : null;

		if (!orderId) return fail(400, { error: "Missing order ID" });

		try {
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 1. Check the physical state of the order BEFORE cancelling it
				const [currentOrder] = await q`SELECT status FROM orders WHERE id = ${orderId}`;

				if (!currentOrder) throw new Error("Order not found");

				// 2. Cancel the top-level ticket
				await q`UPDATE orders SET status = 'cancelled' WHERE id = ${orderId}`;

				// 3. Smart Inventory Routing
				if (currentOrder.status === "preparing") {
					// The barista hadn't finished it yet. We safely VOID the items
					// so your Back Office inventory math knows the beans weren't used.
					await q`
                        UPDATE order_items
                        SET status = 'voided'
                        WHERE order_id = ${orderId} AND status = 'active'
                    `;
				}

				// Note: If currentOrder.status === 'served', we intentionally do nothing
				// to the order_items. They remain 'active', meaning your Waste Report
				// will correctly flag them as lost inventory!
			});

			return { success: true };
		} catch (error) {
			console.error("Cancel Error:", error);
			return fail(500, { error: "Failed to cancel order" });
		}
	},
};
