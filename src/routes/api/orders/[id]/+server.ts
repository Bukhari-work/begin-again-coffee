import { json } from "@sveltejs/kit";
import sql from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
	const orderId = params.id;

	const [order, items] = await Promise.all([
		// 1. Fetch Order Meta
		sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`,

		// 2. Fetch Order Items
		sql`
            SELECT oi.*, i.name
            FROM order_items oi
            LEFT JOIN items i ON oi.item_id = i.id
            WHERE oi.order_id = ${orderId}
        `,
	]);

	if (!order.length) {
		return json({ error: "Order not found" }, { status: 404 });
	}

	return json({
		order: order[0],
		items,
	});
};
