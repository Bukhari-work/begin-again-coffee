import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// ==========================================
	// 1. DAILY DASHBOARD QUERIES (OPERATIONAL)
	// ==========================================
	const dailyPromise = sql`
        WITH today_metrics AS (
            SELECT
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as items_sold
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at::DATE = CURRENT_DATE
        ),
        yesterday_metrics AS (
            SELECT
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at::DATE = CURRENT_DATE - 1
        ),
        shift_metrics AS (
            SELECT
                o.shift,
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at::DATE = CURRENT_DATE
            GROUP BY o.shift
        ),
        category_metrics AS (
            SELECT
                c.name as category,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as units
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE o.created_at::DATE = CURRENT_DATE
            GROUP BY c.name
        )
        SELECT
            (SELECT row_to_json(t) FROM today_metrics t) as today,
            (SELECT row_to_json(y) FROM yesterday_metrics y) as yesterday,
            (SELECT json_agg(s) FROM shift_metrics s) as shifts,
            (SELECT json_agg(c) FROM category_metrics c) as categories
    `;

	// ==========================================
	// 2. MONTHLY DASHBOARD QUERIES (STRATEGIC)
	// ==========================================
	const monthlyPromise = sql`
        WITH month_metrics AS (
            SELECT
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue,
                MAX(o.created_at) as last_sale_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
        ),
        daily_trend AS (
            SELECT
                o.created_at::DATE as date,
                COALESCE(SUM(oi.price_base * oi.quantity), 0) as revenue,
                COUNT(DISTINCT o.id) as orders
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
            GROUP BY o.created_at::DATE
            ORDER BY o.created_at::DATE ASC
        ),
        weekday_pattern AS (
            SELECT
                TRIM(to_char(sale_date, 'Day')) as day_name,
                EXTRACT(ISODOW FROM sale_date) as day_index, -- 1=Mon, 7=Sun
                AVG(daily_rev) as avg_revenue
            FROM (
                SELECT o.created_at::DATE as sale_date, SUM(oi.price_base * oi.quantity) as daily_rev
                FROM orders o JOIN order_items oi ON o.id = oi.order_id
                WHERE date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
                GROUP BY o.created_at::DATE
            ) daily_data
            GROUP BY day_name, day_index
            ORDER BY day_index
        ),
        item_performance AS (
            SELECT
                i.name,
                SUM(oi.quantity) as units_sold,
                SUM(oi.price_base * oi.quantity) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            WHERE date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
            GROUP BY i.name
            ORDER BY revenue DESC
            LIMIT 10
        )
        SELECT
            (SELECT row_to_json(m) FROM month_metrics m) as summary,
            (SELECT json_agg(d) FROM daily_trend d) as trend,
            (SELECT json_agg(w) FROM weekday_pattern w) as heatmap,
            (SELECT json_agg(i) FROM item_performance i) as items
    `;

	// Execute in parallel
	const [dailyRes, monthlyRes] = await Promise.all([dailyPromise, monthlyPromise]);

	// Extract Rows
	const dailyData = dailyRes[0];
	const monthlyData = monthlyRes[0];

	return {
		user,
		daily: {
			stats: dailyData.today || { orders: 0, revenue: 0, items_sold: 0 },
			yesterday: dailyData.yesterday || { orders: 0, revenue: 0 },
			shifts: dailyData.shifts || [],
			categories: dailyData.categories || [],
		},
		monthly: {
			stats: monthlyData.summary || { orders: 0, revenue: 0 },
			trend: monthlyData.trend || [],
			heatmap: monthlyData.heatmap || [],
			items: monthlyData.items || [],
		},
	};
};
