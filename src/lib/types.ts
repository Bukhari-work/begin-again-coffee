// src/lib/types.ts

export interface OrderModifier {
	name: string;
	qty: number;
}

export interface OrderItem {
	id: number;
	name: string;
	qty: number;
	fulfillment_status: "preparing" | "served" | "cancelled";
	modifiers: OrderModifier[];
}

export interface QueueOrder {
	id: number;
	customer_name: string | null;
	payment_method: string | null;
	created_at: string;
	// Postgres often returns numeric/decimal types as strings to prevent precision loss
	price_total: number | string;
	derived_status: "empty" | "cancelled" | "served" | "preparing";
	items: OrderItem[];
}
