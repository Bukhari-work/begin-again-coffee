import sql from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, setHeaders }) => {
	setHeaders({ "Cache-Control": "max-age=300" });
	const { user } = await parent();

	// ==========================================
	// 1. DAILY DASHBOARD QUERIES (OPERATIONAL)
	// ==========================================
	const dailyPromise = sql`
        WITH today_metrics AS (
            SELECT
                count(*) FILTER (WHERE kind = 'sale') as orders,
                COALESCE(SUM(price_total), 0) as revenue
            FROM orders
            WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
        ),
        today_items AS (
            -- We query items separately to keep the top-level revenue query lightning fast
            SELECT COALESCE(SUM(quantity), 0) as items_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= CURRENT_DATE
  AND o.created_at < CURRENT_DATE + INTERVAL '1 day'
              AND oi.ledger_status IN ('active', 'refunded')
        ),
        yesterday_metrics AS (
            SELECT
                count(*) FILTER (WHERE kind = 'sale') as orders,
                COALESCE(SUM(price_total), 0) as revenue
            FROM orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
              AND created_at < CURRENT_DATE
        ),
        shift_metrics AS (
            SELECT
                shift,
                count(*) FILTER (WHERE kind = 'sale') as orders,
                COALESCE(SUM(price_total), 0) as revenue
            FROM orders
            WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY shift
        ),
        category_metrics AS (
            SELECT
                c.name as item_category,
                COALESCE(SUM(oi.price_total), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as units
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            -- Routing through the variation as per our schema fix
            JOIN item_variations iv ON oi.item_variation_id = iv.id
            JOIN items i ON iv.item_id = i.id
            LEFT JOIN item_categories c ON i.category_id = c.id
            WHERE o.created_at >= CURRENT_DATE
              AND o.created_at < CURRENT_DATE + INTERVAL '1 day'
              AND oi.ledger_status IN ('active', 'refunded')
            GROUP BY c.name
        )
        SELECT
            (SELECT row_to_json(t) FROM (
                SELECT m.orders, m.revenue, i.items_sold
                FROM today_metrics m CROSS JOIN today_items i
            ) t) as today,
            (SELECT row_to_json(y) FROM yesterday_metrics y) as yesterday,
            (SELECT json_agg(s) FROM shift_metrics s) as shifts,
            (SELECT json_agg(c) FROM category_metrics c) as categories
            -- Fixed the typo in the original alias: item_category_metrics -> category_metrics
    `;

	// ==========================================
	// 2. MONTHLY DASHBOARD QUERIES (STRATEGIC)
	// ==========================================
	const monthlyPromise = sql`
        WITH month_metrics AS (
            SELECT
                count(*) FILTER (WHERE kind = 'sale') as orders,
                COALESCE(SUM(price_total), 0) as revenue,
                MAX(created_at) as last_sale_date
            FROM orders
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
        ),
        daily_trend AS (
            SELECT
                created_at::DATE as date,
                COALESCE(SUM(price_total), 0) as revenue,
                count(*) FILTER (WHERE kind = 'sale') as orders
            FROM orders
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY created_at::DATE
            ORDER BY created_at::DATE ASC
        ),
        weekday_pattern AS (
            SELECT
                to_char(sale_date, 'FMDay') as day_name,
                EXTRACT(ISODOW FROM sale_date) as day_index, -- 1=Mon, 7=Sun
                AVG(daily_rev) as avg_revenue
            FROM (
                SELECT created_at::DATE as sale_date, SUM(price_total) as daily_rev
                FROM orders
                WHERE created_at >= date_trunc('month', CURRENT_DATE)
                  AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
                GROUP BY created_at::DATE
            ) daily_data
            GROUP BY day_name, day_index
            ORDER BY day_index
        ),
        item_performance AS (
            SELECT
                iv.name as variation_name,
                i.name as parent_item_name,
                SUM(oi.quantity) as units_sold,
                SUM(oi.price_total) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN item_variations iv ON oi.item_variation_id = iv.id
            JOIN items i ON iv.item_id = i.id
            WHERE o.created_at >= date_trunc('month', CURRENT_DATE)
              AND o.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
              AND oi.ledger_status IN ('active', 'refunded')
            GROUP BY iv.id, iv.name, i.name
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
			stats: monthlyData.summary || { orders: 0, revenue: 0, last_sale_date: null },
			trend: monthlyData.trend || [],
			heatmap: monthlyData.heatmap || [],
			items: monthlyData.items || [],
		},
	};
};
