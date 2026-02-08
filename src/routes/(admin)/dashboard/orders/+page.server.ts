import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch orders with calculated totals, shift info, and item counts
	const orders = await sql`
        SELECT
            o.id,
            o.customer_name,
            o.payment_type,
            o.order_date,
            o.shift,
            COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total_amount,
            COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.order_date DESC, o.id DESC
    `;

	return { orders };
};
