import sql from "$lib/server/db";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const orderId = params.id;

	// Fetch order metadata
	const orderResult = await sql`
        SELECT * FROM orders WHERE id = ${orderId}
    `;

	if (orderResult.length === 0) throw error(404, "Order not found");

	// Fetch items in that order
	const items = await sql`
        SELECT oi.*, i.name
        FROM order_items oi
        LEFT JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = ${orderId}
    `;

	return {
		order: orderResult[0],
		items,
	};
};
