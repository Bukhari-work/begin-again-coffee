import sql from "$lib/server/db";
import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Uses the superior sorting logic from Snippet 1
	// to ensure featured items appear first.
	const items = await sql`
        SELECT i.id, i.name, i.price, i.description, c.name as category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        ORDER BY i.featured_rank DESC, c.name ASC, i.name ASC
    `;

	return { items };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const customerName = formData.get("customer_name") as string;
		const paymentType = formData.get("payment_type") as string;
		const shift = formData.get("shift") as string;
		const cartJson = formData.get("cart") as string;

		// Strict validation: Ensures 'shift' is present before proceeding
		if (!paymentType || !cartJson || !shift) {
			return fail(400, { error: "Missing required fields (Payment, Shift, or Cart)" });
		}

		let cart;
		try {
			cart = JSON.parse(cartJson);
		} catch (e) {
			return fail(400, { error: "Invalid cart format" });
		}

		if (cart.length === 0) {
			return fail(400, { error: "Cart is empty" });
		}

		try {
			// DATABASE TRANSACTION
			// We use the 'q' cast from Snippet 2 for better IDE support/IntelliSense
			await sql.begin(async (tx) => {
				const q = tx as unknown as typeof sql;

				// 1. Create the Order
				const [newOrder] = await q`
                    INSERT INTO orders (customer_name, payment_type, shift)
                    VALUES (${customerName}, ${paymentType}, ${shift})
                    RETURNING id
                `;

				// 2. Create Order Items (Atomic operation)
				for (const item of cart) {
					await q`
                        INSERT INTO order_items (order_id, item_id, price_at_purchase, quantity)
                        VALUES (${newOrder.id}, ${item.id}, ${item.price}, ${item.qty})
                    `;
				}
			});

			// Redirect to the specific orders page for confirmation
			throw redirect(303, "/dashboard/orders");
		} catch (error) {
			// If the error was a redirect, re-throw it so SvelteKit handles it
			if (error && typeof error === "object" && "status" in error) throw error;

			console.error("POS Transaction Error:", error);
			return fail(500, { error: "Failed to process order. Please try again." });
		}
	},
};
