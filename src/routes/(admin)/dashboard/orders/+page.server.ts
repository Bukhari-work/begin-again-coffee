import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const orders = await sql`
        -- 1. Get total from base items
        WITH base_item_totals AS (
            SELECT
                order_id,
                SUM(price_base * quantity) as base_total,
                COUNT(id) as item_count
            FROM order_items
            GROUP BY order_id
        ),
        -- 2. Get total from modifiers
        modifier_totals AS (
            SELECT
                oi.order_id,
                SUM(oim.price_base * oim.quantity_per_item) as mod_total
            FROM order_item_modifiers oim
            JOIN order_items oi ON oim.order_item_id = oi.id
            GROUP BY oi.order_id
        )
        -- 3. Combine them
        SELECT
            o.id, o.customer_name, o.payment_method, o.created_at, o.shift,
            COALESCE(bit.base_total, 0) + COALESCE(mt.mod_total, 0) as total_amount,
            COALESCE(bit.item_count, 0) as item_count
        FROM orders o
        LEFT JOIN base_item_totals bit ON o.id = bit.order_id
        LEFT JOIN modifier_totals mt ON o.id = mt.order_id
        ORDER BY o.created_at DESC, o.id DESC
    `;

	return { orders };
};
