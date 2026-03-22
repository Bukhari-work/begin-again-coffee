import { json } from "@sveltejs/kit";
import sql from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
	const orderId = params.id;

	const [orderResult, itemsResult, modifiersResult] = await Promise.all([
		// 1. Fetch Order Meta
		sql`
			SELECT id, customer_name, payment_method, shift, created_at
			FROM orders
			WHERE id = ${orderId}
			LIMIT 1
		`,

		// 2. Fetch Base Order Items
		sql`
			SELECT
				oi.id,
				oi.quantity,
				oi.price_base,
				i.name
			FROM order_items oi
			JOIN items i ON oi.item_id = i.id
			WHERE oi.order_id = ${orderId}
			ORDER BY oi.id ASC
		`,

		// 3. Fetch all Modifiers attached to this Order's Items
		sql`
			SELECT
				oim.order_item_id,
				oim.quantity,
				oim.price_base,
				m.name
			FROM order_item_modifiers oim
			JOIN modifiers m ON oim.modifier_id = m.id
			JOIN order_items oi ON oim.order_item_id = oi.id
			WHERE oi.order_id = ${orderId}
			ORDER BY oim.id ASC
		`,
	]);

	if (orderResult.length === 0) {
		return json({ error: "Order not found" }, { status: 404 });
	}

	// 4. Map the modifiers into their respective items
	const itemsWithModifiers = itemsResult.map((item) => {
		return {
			...item,
			// Filter the flat modifiers array to only those belonging to this specific order_item
			modifiers: modifiersResult.filter((mod) => mod.order_item_id === item.id),
		};
	});

	return json({
		order: orderResult[0],
		items: itemsWithModifiers,
	});
};
